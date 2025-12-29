import {
  SwaggerSpec,
  EndpointInfo,
  GeneratedInterface,
  ResolvedGeneratorConfig,
} from "../core/types";
import { SchemaParser } from "../parsers/schema-parser";
import { FileWriter } from "../writers/file-writer";
import { NamingUtil } from "../utils/naming";
import { Logger } from "../utils/logger";

interface TypeInfo {
  name: string;
  content: string;
  resource: string;
  suffix: "Request" | "Response" | "Params";
}

export class ModelGenerator {
  private schemaParser: SchemaParser;
  private fileWriter: FileWriter;

  constructor(outputDir: string) {
    this.schemaParser = new SchemaParser();
    this.fileWriter = new FileWriter(outputDir);
  }

  generate(
    spec: SwaggerSpec,
    endpointsByTag: Map<string, EndpointInfo[]>,
    config: ResolvedGeneratorConfig
  ) {
    Logger.step("Generating model interfaces...");

    // Set spec for $ref resolution
    this.schemaParser.setSpec(spec);

    for (const [tag, endpoints] of endpointsByTag.entries()) {
      this.generateTagModels(tag, endpoints, spec);
    }

    Logger.success("Model generation completed");
  }

  /**
   * Group all types by resource name
   * customer: [ICustomerRequest, ICustomerResponse, ICustomerParams]
   */
  private groupByResource(
    endpointsByTag: Map<string, EndpointInfo[]>,
    spec: SwaggerSpec
  ): Map<string, Set<GeneratedInterface>> {
    const typesByResource = new Map<string, Set<GeneratedInterface>>();

    for (const [tag, endpoints] of endpointsByTag.entries()) {
      for (const endpoint of endpoints) {
        if (!endpoint.operationId) continue;

        // Extract resource name (clean!)
        const resourceName = NamingUtil.extractResourceName(
          endpoint.operationId
        );
        const resourceKey = resourceName.toLowerCase();

        if (!typesByResource.has(resourceKey)) {
          typesByResource.set(resourceKey, new Set());
        }

        // Generate types for this endpoint
        const interfaces = this.generateEndpointTypes(
          endpoint,
          spec,
          resourceName
        );

        for (const iface of interfaces) {
          typesByResource.get(resourceKey)!.add(iface);
        }
      }
    }

    return typesByResource;
  }

  /**
   * Generate all type interfaces for an endpoint
   */
  private generateEndpointTypes(
    endpoint: EndpointInfo,
    spec: SwaggerSpec,
    resourceName: string
  ): GeneratedInterface[] {
    const interfaces: GeneratedInterface[] = [];

    // Request type
    if (["POST", "PUT", "PATCH"].includes(endpoint.method)) {
      const requestSchema = this.extractRequestSchema(endpoint, spec);
      if (requestSchema) {
        const requestInterface = this.schemaParser.parseSchema(
          requestSchema,
          `I${resourceName}Request`
        );
        if (requestInterface) {
          interfaces.push(requestInterface);
        }
      }
    }

    // Response type
    const responseSchema = this.extractResponseSchema(endpoint, spec);
    if (responseSchema) {
      const responseInterface = this.schemaParser.parseSchema(
        responseSchema,
        `I${resourceName}Response`
      );
      if (responseInterface) {
        interfaces.push(responseInterface);
      }
    }

    // Params type (for GET)
    if (endpoint.method === "GET") {
      const paramsInterface = this.generateParamsInterface(
        endpoint,
        spec,
        resourceName
      );
      if (paramsInterface) {
        interfaces.push(paramsInterface);
      }
    }

    return interfaces;
  }

  /**
   * Generate one file for a resource with all its types
   */
  private generateResourceFile(
    resource: string,
    interfaces: Set<GeneratedInterface>
  ) {
    // Deduplicate by name
    const uniqueInterfaces = new Map<string, GeneratedInterface>();

    for (const iface of interfaces) {
      if (!uniqueInterfaces.has(iface.name)) {
        uniqueInterfaces.set(iface.name, iface);
      }
    }

    const content = Array.from(uniqueInterfaces.values())
      .map((i) => i.content)
      .join("\n");

    this.fileWriter.writeFile(`${resource}.ts`, content, true);
  }

  /**
   * Generate models for a tag (legacy method for compatibility)
   */
  private generateTagModels(
    tag: string,
    endpoints: EndpointInfo[],
    spec: SwaggerSpec
  ) {
    this.schemaParser.reset();
    const interfaces: any[] = [];

    for (const endpoint of endpoints) {
      const baseName = this.getBaseName(endpoint, tag);

      // Request
      const requestSchema = this.extractRequestSchema(endpoint, spec);
      if (requestSchema) {
        const requestInterface = this.schemaParser.parseSchema(
          requestSchema,
          baseName,
          "Request"
        );
        if (requestInterface) {
          interfaces.push(requestInterface);
        }
      }

      // Response
      const responseSchema = this.extractResponseSchema(endpoint, spec);
      if (responseSchema) {
        const responseInterface = this.schemaParser.parseSchema(
          responseSchema,
          baseName,
          "Response"
        );
        if (responseInterface) {
          interfaces.push(responseInterface);
        }
      }

      // Params
      if (endpoint.method === "GET" && this.hasParameters(endpoint, spec)) {
        const paramsInterface = this.generateParamsInterface(
          endpoint,
          spec,
          baseName
        );
        if (paramsInterface) {
          interfaces.push(paramsInterface);
        }
      }
    }

    if (interfaces.length > 0) {
      const content = interfaces.map((i) => i.content).join("\n");
      this.fileWriter.writeFile(`${tag}.ts`, content, true);
    }
  }

  private getBaseName(endpoint: EndpointInfo, tag: string): string {
    if (endpoint.operationId) {
      // Clean operation ID and extract resource
      const resource = NamingUtil.extractResourceName(endpoint.operationId);
      return resource;
    }
    return NamingUtil.pascalCase(tag);
  }

  private extractRequestSchema(endpoint: EndpointInfo, spec: SwaggerSpec): any {
    const pathData = spec.paths[endpoint.originalPath || endpoint.path];
    const methodData = pathData?.[endpoint.method.toLowerCase()];

    if (!methodData?.requestBody) return null;

    const content = methodData.requestBody.content;
    const jsonContent = content?.["application/json"] || content?.["*/*"];

    return jsonContent?.schema;
  }

  private extractResponseSchema(
    endpoint: EndpointInfo,
    spec: SwaggerSpec
  ): any {
    const pathData = spec.paths[endpoint.originalPath || endpoint.path];
    const methodData = pathData?.[endpoint.method.toLowerCase()];

    const response =
      methodData?.responses?.["200"] ||
      methodData?.responses?.["201"] ||
      methodData?.responses?.["default"];

    if (!response?.content) return null;

    const jsonContent =
      response.content["application/json"] || response.content["*/*"];

    return jsonContent?.schema;
  }

  private hasParameters(endpoint: EndpointInfo, spec: SwaggerSpec): boolean {
    const pathData = spec.paths[endpoint.originalPath || endpoint.path];
    const methodData = pathData?.[endpoint.method.toLowerCase()];

    return !!(methodData?.parameters && methodData.parameters.length > 0);
  }

  private generateParamsInterface(
    endpoint: EndpointInfo,
    spec: SwaggerSpec,
    baseName: string
  ): GeneratedInterface | null {
    const pathData = spec.paths[endpoint.originalPath || endpoint.path];
    const methodData = pathData[endpoint.method.toLowerCase()];
    const parameters = methodData?.parameters || [];

    if (parameters.length === 0) return null;

    const name = NamingUtil.getInterfaceName(baseName, "Params");
    let properties = "";

    for (const param of parameters) {
      const required = param.required ? "" : "?";
      const type = param.schema ? this.getParamType(param.schema) : "any";
      const description = param.description
        ? `  /** ${param.description} */\n`
        : "";

      properties += `${description}  ${param.name}${required}: ${type};\n`;
    }

    const content = `export interface ${name} {\n${properties}}\n`;

    return { name, content };
  }

  private getParamType(schema: any): string {
    switch (schema.type) {
      case "string":
        return "string";
      case "number":
      case "integer":
        return "number";
      case "boolean":
        return "boolean";
      case "array":
        return "any[]";
      default:
        return "any";
    }
  }
}
