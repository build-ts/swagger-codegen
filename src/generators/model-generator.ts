import { SwaggerSpec, EndpointInfo, GeneratedInterface, ResolvedGeneratorConfig } from '../core/types';
import { SchemaParser } from '../parsers/schema-parser';
import { FileWriter } from '../writers/file-writer';
import { NamingUtil } from '../utils/naming';
import { Logger } from '../utils/logger';

interface TypeInfo {
  name: string;
  content: string;
  resource: string;
  suffix: 'Request' | 'Response' | 'Params';
}

export class ModelGenerator {
  private schemaParser: SchemaParser;
  private fileWriter: FileWriter;
  private typeRegistry: Map<string, TypeInfo> = new Map();

  constructor(outputDir: string) {
    this.schemaParser = new SchemaParser();
    this.fileWriter = new FileWriter(outputDir);
  }

  generate(spec: SwaggerSpec, endpointsByTag: Map<string, EndpointInfo[]>, config: ResolvedGeneratorConfig) {
    Logger.step('Generating model interfaces...');

    // First pass: collect all types by resource
    const typesByResource = this.collectTypesByResource(endpointsByTag, spec);

    // Second pass: generate deduplicated types
    for (const [resource, types] of typesByResource.entries()) {
      this.generateResourceModels(resource, types, spec);
    }

    Logger.success('Model generation completed');
  }

  /**
   * Collect all types grouped by resource name
   */
  private collectTypesByResource(
    endpointsByTag: Map<string, EndpointInfo[]>,
    spec: SwaggerSpec
  ): Map<string, Set<'Request' | 'Response' | 'Params'>> {
    const typesByResource = new Map<string, Set<'Request' | 'Response' | 'Params'>>();

    for (const [tag, endpoints] of endpointsByTag.entries()) {
      for (const endpoint of endpoints) {
        const resource = this.getResourceName(endpoint);

        if (!typesByResource.has(resource)) {
          typesByResource.set(resource, new Set());
        }

        const types = typesByResource.get(resource)!;

        // Check what types this endpoint needs
        if (this.extractRequestSchema(endpoint, spec)) {
          types.add('Request');
        }
        if (this.extractResponseSchema(endpoint, spec)) {
          types.add('Response');
        }
        if (endpoint.method === 'GET' && this.hasParameters(endpoint, spec)) {
          types.add('Params');
        }
      }
    }

    return typesByResource;
  }

  /**
   * Generate all types for a resource
   */
  private generateResourceModels(
    resource: string,
    types: Set<'Request' | 'Response' | 'Params'>,
    spec: SwaggerSpec
  ) {
    const interfaces: string[] = [];

    // Generate each type
    for (const type of ['Request', 'Response', 'Params'] as const) {
      if (types.has(type)) {
        const interfaceContent = this.generateTypeInterface(resource, type, spec);
        if (interfaceContent) {
          interfaces.push(interfaceContent);
        }
      }
    }

    if (interfaces.length > 0) {
      const content = interfaces.join('\n');
      const fileName = `${resource.toLowerCase()}.ts`;
      this.fileWriter.writeFile(fileName, content, true);
    }
  }

  /**
   * Generate a single type interface
   */
  private generateTypeInterface(
    resource: string,
    suffix: 'Request' | 'Response' | 'Params',
    spec: SwaggerSpec
  ): string | null {
    const interfaceName = NamingUtil.getInterfaceName(resource, suffix);

    // For now, generate generic interface
    // In production, you'd parse the actual schema
    const content = `export interface ${interfaceName} {\n  [key: string]: any;\n}\n`;

    return content;
  }

  /**
   * Get resource name from endpoint
   */
  private getResourceName(endpoint: EndpointInfo): string {
    if (endpoint.operationId) {
      return NamingUtil.extractResourceName(endpoint.operationId);
    }
    
    // Fallback to path-based naming
    const resource = NamingUtil.getResourceFromPath(endpoint.path);
    return NamingUtil.pascalCase(NamingUtil.singularize(resource));
  }

  /**
   * Generate models for a tag (legacy method for compatibility)
   */
  generateTagModels(
    tag: string,
    endpoints: EndpointInfo[],
    spec: SwaggerSpec
  ) {
    this.schemaParser.reset();
    const interfaces: GeneratedInterface[] = [];

    for (const endpoint of endpoints) {
      const baseName = this.getBaseName(endpoint, tag);

      // Request
      const requestSchema = this.extractRequestSchema(endpoint, spec);
      if (requestSchema) {
        const requestInterface = this.schemaParser.parseSchema(
          requestSchema,
          baseName,
          'Request'
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
          'Response'
        );
        if (responseInterface) {
          interfaces.push(responseInterface);
        }
      }

      // Params
      if (endpoint.method === 'GET' && this.hasParameters(endpoint, spec)) {
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
      const content = interfaces.map(i => i.content).join('\n');
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
    const jsonContent = content?.['application/json'] || content?.['*/*'];

    return jsonContent?.schema;
  }

  private extractResponseSchema(endpoint: EndpointInfo, spec: SwaggerSpec): any {
    const pathData = spec.paths[endpoint.originalPath || endpoint.path];
    const methodData = pathData?.[endpoint.method.toLowerCase()];

    const response = methodData?.responses?.['200'] || 
                     methodData?.responses?.['201'] || 
                     methodData?.responses?.['default'];

    if (!response?.content) return null;

    const jsonContent = response.content['application/json'] || 
                        response.content['*/*'];

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

    const name = NamingUtil.getInterfaceName(baseName, 'Params');
    let properties = '';

    for (const param of parameters) {
      const required = param.required ? '' : '?';
      const type = param.schema 
        ? this.getParamType(param.schema)
        : 'any';
      const description = param.description 
        ? `  /** ${param.description} */\n` 
        : '';

      properties += `${description}  ${param.name}${required}: ${type};\n`;
    }

    const content = `export interface ${name} {\n${properties}}\n`;

    return { name, content };
  }

  private getParamType(schema: any): string {
    switch (schema.type) {
      case 'string':
        return 'string';
      case 'number':
      case 'integer':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'array':
        return 'any[]';
      default:
        return 'any';
    }
  }
}