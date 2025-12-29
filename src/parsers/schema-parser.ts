import { SchemaObject, GeneratedInterface } from '../core/types';
import { TypeMapper } from '../utils/type-mapper';
import { NamingUtil } from '../utils/naming';

export class SchemaParser {
  private usedNames = new Set<string>();

  parseSchema(
    schema: SchemaObject,
    baseName: string,
    suffix: string = ''
  ): GeneratedInterface | null {
    const name = NamingUtil.getInterfaceName(baseName, suffix);

    if (this.usedNames.has(name)) {
      return null;
    }

    this.usedNames.add(name);

    if (!schema.properties) {
      return {
        name,
        content: `export interface ${name} {\n  [key: string]: any;\n}\n`,
      };
    }

    const nestedInterfaces: string[] = [];
    const properties = this.parseProperties(
      schema,
      baseName,
      nestedInterfaces
    );

    let content = '';
    if (nestedInterfaces.length > 0) {
      content = nestedInterfaces.join('\n') + '\n';
    }

    content += `export interface ${name} {\n${properties}}\n`;

    return { name, content };
  }

  private parseProperties(
    schema: SchemaObject,
    baseName: string,
    nestedInterfaces: string[]
  ): string {
    let properties = '';

    for (const [propName, propSchema] of Object.entries(schema.properties!)) {
      const required = schema.required?.includes(propName) ? '' : '?';
      const description = propSchema.description
        ? `  /** ${propSchema.description} */\n`
        : '';

      // Nested object
      if (propSchema.type === 'object' && propSchema.properties) {
        const nestedName = NamingUtil.getInterfaceName(
          `${baseName}${NamingUtil.capitalize(propName)}`,
          ''
        );

        if (!this.usedNames.has(nestedName)) {
          this.usedNames.add(nestedName);
          const nestedProps = this.parseProperties(
            propSchema,
            `${baseName}${NamingUtil.capitalize(propName)}`,
            nestedInterfaces
          );

          nestedInterfaces.push(
            `export interface ${nestedName} {\n${nestedProps}}\n`
          );
        }

        properties += `${description}  ${propName}${required}: ${nestedName};\n`;
      } else {
        const type = TypeMapper.mapSwaggerTypeToTS(propSchema);
        properties += `${description}  ${propName}${required}: ${type};\n`;
      }
    }

    return properties;
  }

  reset() {
    this.usedNames.clear();
  }
}