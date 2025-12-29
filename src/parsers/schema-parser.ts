import { SchemaObject, GeneratedInterface, SwaggerSpec } from "../core/types";
import { TypeMapper } from "../utils/type-mapper";
import { NamingUtil } from "../utils/naming";

export class SchemaParser {
  private usedNames = new Set<string>();
  private spec: SwaggerSpec | null = null;
  private resolvedRefs = new Map<string, SchemaObject>();

  setSpec(spec: SwaggerSpec) {
    this.spec = spec;
  }

  parseSchema(
    schema: SchemaObject,
    baseName: string,
    suffix: string = ""
  ): GeneratedInterface | null {
    // Handle $ref
    if (schema.$ref) {
      const resolved = this.resolveRef(schema.$ref);
      if (resolved) {
        return this.parseSchema(resolved, baseName, suffix);
      }
    }

    const name = NamingUtil.getInterfaceName(baseName, suffix);

    // Check if already generated
    if (this.usedNames.has(name)) {
      return null;
    }

    this.usedNames.add(name);

    // Handle allOf (merge schemas)
    if (schema.allOf) {
      return this.parseAllOf(schema.allOf, name);
    }

    // Handle oneOf (union types)
    if (schema.oneOf) {
      return this.parseOneOf(schema.oneOf, name);
    }

    // No properties - generic interface
    if (!schema.properties || Object.keys(schema.properties).length === 0) {
      return {
        name,
        content: `export interface ${name} {\n  [key: string]: any;\n}\n`,
      };
    }

    // Parse properties
    const nestedInterfaces: string[] = [];
    const properties = this.parseProperties(schema, baseName, nestedInterfaces);

    // Build interface content
    let content = "";

    // Add nested interfaces first
    if (nestedInterfaces.length > 0) {
      content = nestedInterfaces.join("\n") + "\n";
    }

    // Add description if exists
    if (schema.description) {
      content += `/**\n * ${schema.description}\n */\n`;
    }

    // Main interface
    content += `export interface ${name} {\n${properties}}\n`;

    return { name, content };
  }

  /**
   * Parse object properties
   */
  private parseProperties(
    schema: SchemaObject,
    baseName: string,
    nestedInterfaces: string[]
  ): string {
    let properties = "";

    if (!schema.properties) return properties;

    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      const required = schema.required?.includes(propName) ? "" : "?";

      // Add description
      if (propSchema.description) {
        properties += `  /** ${propSchema.description} */\n`;
      }

      // Add readonly/writeOnly markers
      if (propSchema.readOnly) {
        properties += `  /** @readonly */\n`;
      }
      if (propSchema.writeOnly) {
        properties += `  /** @writeonly */\n`;
      }

      // Handle $ref
      if (propSchema.$ref) {
        const resolved = this.resolveRef(propSchema.$ref);
        if (resolved) {
          const type = this.getPropertyType(
            resolved,
            propName,
            baseName,
            nestedInterfaces
          );
          properties += `  ${propName}${required}: ${type};\n`;
        } else {
          properties += `  ${propName}${required}: any;\n`;
        }
        continue;
      }

      // Get type
      const type = this.getPropertyType(
        propSchema,
        propName,
        baseName,
        nestedInterfaces
      );
      properties += `  ${propName}${required}: ${type};\n`;
    }

    return properties;
  }

  /**
   * Get property type
   */
  private getPropertyType(
    propSchema: SchemaObject,
    propName: string,
    baseName: string,
    nestedInterfaces: string[]
  ): string {
    // Handle enum
    if (propSchema.enum) {
      return propSchema.enum.map((v) => `'${v}'`).join(" | ");
    }

    // ✅ Handle nested object - CREATE SEPARATE INTERFACE
    if (
      (propSchema.type === "object" || propSchema.properties) &&
      propSchema.properties
    ) {
      const nestedName = NamingUtil.getInterfaceName(
        `${baseName}${NamingUtil.capitalize(propName)}`,
        ""
      );

      if (!this.usedNames.has(nestedName)) {
        this.usedNames.add(nestedName);

        // Parse nested properties
        const nestedProps = this.parseProperties(
          propSchema,
          `${baseName}${NamingUtil.capitalize(propName)}`,
          nestedInterfaces
        );

        // Add description if exists
        let interfaceContent = "";
        if (propSchema.description) {
          interfaceContent += `/**\n * ${propSchema.description}\n */\n`;
        }
        interfaceContent += `export interface ${nestedName} {\n${nestedProps}}\n`;

        nestedInterfaces.push(interfaceContent);
      }

      return nestedName;
    }

    // Handle array
    if (propSchema.type === "array" && propSchema.items) {
      const itemType = this.getArrayItemType(
        propSchema.items,
        propName,
        baseName,
        nestedInterfaces
      );
      return `${itemType}[]`;
    }

    // Handle allOf
    if (propSchema.allOf) {
      return this.parseAllOfType(propSchema.allOf);
    }

    // Handle oneOf (union)
    if (propSchema.oneOf) {
      return this.parseOneOfType(propSchema.oneOf);
    }

    // Handle additionalProperties
    if (propSchema.additionalProperties) {
      if (typeof propSchema.additionalProperties === "object") {
        const valueType = TypeMapper.mapSwaggerTypeToTS(
          propSchema.additionalProperties
        );
        return `Record<string, ${valueType}>`;
      }
      return "Record<string, any>";
    }

    // Basic types
    return TypeMapper.mapSwaggerTypeToTS(propSchema);
  }
  /**
   * Get array item type
   */
  private getArrayItemType(
    items: SchemaObject,
    propName: string,
    baseName: string,
    nestedInterfaces: string[]
  ): string {
    // Handle $ref in array items
    if (items.$ref) {
      const resolved = this.resolveRef(items.$ref);
      if (resolved) {
        return this.getArrayItemType(
          resolved,
          propName,
          baseName,
          nestedInterfaces
        );
      }
      return "any";
    }

    // Nested object in array
    if (items.type === "object" && items.properties) {
      const nestedName = NamingUtil.getInterfaceName(
        `${baseName}${NamingUtil.capitalize(propName)}Item`,
        ""
      );

      if (!this.usedNames.has(nestedName)) {
        this.usedNames.add(nestedName);
        const nestedProps = this.parseProperties(
          items,
          `${baseName}${NamingUtil.capitalize(propName)}Item`,
          nestedInterfaces
        );

        nestedInterfaces.push(
          `export interface ${nestedName} {\n${nestedProps}}\n`
        );
      }

      return nestedName;
    }

    // Basic type
    return TypeMapper.mapSwaggerTypeToTS(items);
  }

  /**
   * Parse allOf (merge schemas)
   */
  private parseAllOf(
    schemas: SchemaObject[],
    interfaceName: string
  ): GeneratedInterface {
    const properties: string[] = [];
    const nestedInterfaces: string[] = [];

    for (const schema of schemas) {
      // Resolve $ref
      const resolved = schema.$ref ? this.resolveRef(schema.$ref) : schema;
      if (!resolved) continue;

      // Get properties
      const props = this.parseProperties(
        resolved,
        interfaceName.replace(/^I/, ""),
        nestedInterfaces
      );

      if (props) {
        properties.push(props);
      }
    }

    let content = "";

    if (nestedInterfaces.length > 0) {
      content = nestedInterfaces.join("\n") + "\n";
    }

    content += `export interface ${interfaceName} {\n${properties.join("")}}\n`;

    return { name: interfaceName, content };
  }

  /**
   * Parse allOf as type (for property)
   */
  private parseAllOfType(schemas: SchemaObject[]): string {
    const types: string[] = [];

    for (const schema of schemas) {
      if (schema.$ref) {
        const refName = schema.$ref.split("/").pop();
        if (refName) {
          types.push(refName);
        }
      } else {
        types.push(TypeMapper.mapSwaggerTypeToTS(schema));
      }
    }

    return types.join(" & ");
  }

  /**
   * Parse oneOf (union types)
   */
  private parseOneOf(
    schemas: SchemaObject[],
    interfaceName: string
  ): GeneratedInterface {
    const types = this.parseOneOfType(schemas);

    const content = `export type ${interfaceName} = ${types};\n`;

    return { name: interfaceName, content };
  }

  /**
   * Parse oneOf as type (for property)
   */
  private parseOneOfType(schemas: SchemaObject[]): string {
    const types: string[] = [];

    for (const schema of schemas) {
      if (schema.$ref) {
        const refName = schema.$ref.split("/").pop();
        if (refName) {
          types.push(refName);
        }
      } else {
        types.push(TypeMapper.mapSwaggerTypeToTS(schema));
      }
    }

    return types.join(" | ");
  }

  /**
   * Resolve $ref to actual schema
   */
  private resolveRef(ref: string): SchemaObject | null {
    if (!this.spec) return null;

    // Check cache
    if (this.resolvedRefs.has(ref)) {
      return this.resolvedRefs.get(ref)!;
    }

    // Parse ref path
    // #/components/schemas/User -> ['components', 'schemas', 'User']
    const parts = ref.replace("#/", "").split("/");

    let schema: any = this.spec;

    for (const part of parts) {
      schema = schema[part];
      if (!schema) return null;
    }

    // Cache resolved ref
    this.resolvedRefs.set(ref, schema);

    return schema as SchemaObject;
  }

  /**
   * Reset parser state
   */
  reset() {
    this.usedNames.clear();
    this.resolvedRefs.clear();
  }
}
