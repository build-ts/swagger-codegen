import { SwaggerSpec, EndpointInfo, GeneratedInterface } from '../core/types';
import { SchemaParser } from '../parsers/schema-parser';
import { FileWriter } from '../writers/file-writer';
import { NamingUtil } from '../utils/naming';
import { Logger } from '../utils/logger';

export class ModelGenerator {
  private schemaParser: SchemaParser;
  private fileWriter: FileWriter;

  constructor(outputDir: string) {
    this.schemaParser = new SchemaParser();
    this.fileWriter = new FileWriter(outputDir);
  }

  generate(spec: SwaggerSpec, endpointsByTag: Map<string, EndpointInfo[]>) {
    Logger.step('Generating model interfaces...');

    for (const [tag, endpoints] of endpointsByTag.entries()) {
      this.generateTagModels(tag, endpoints, spec);
    }

    Logger.success('Model generation completed');
  }

  private generateTagModels(
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
      return NamingUtil.pascalCase(endpoint.operationId);
    }
    return NamingUtil.pascalCase(tag);
  }

  private extractRequestSchema(endpoint: EndpointInfo, spec: SwaggerSpec): any {
    const pathData = spec.paths[endpoint.path];
    const methodData = pathData[endpoint.method.toLowerCase()];

    if (!methodData?.requestBody) return null;

    const content = methodData.requestBody.content;
    const jsonContent = content?.['application/json'] || content?.['*/*'];

    return jsonContent?.schema;
  }

  private extractResponseSchema(endpoint: EndpointInfo, spec: SwaggerSpec): any {
    const pathData = spec.paths[endpoint.path];
    const methodData = pathData[endpoint.method.toLowerCase()];

    const response = methodData?.responses?.['200'] || 
                     methodData?.responses?.['201'] || 
                     methodData?.responses?.['default'];

    if (!response?.content) return null;

    const jsonContent = response.content['application/json'] || 
                        response.content['*/*'];

    return jsonContent?.schema;
  }

  private hasParameters(endpoint: EndpointInfo, spec: SwaggerSpec): boolean {
    const pathData = spec.paths[endpoint.path];
    const methodData = pathData?.[endpoint.method.toLowerCase()];
    
    // Explicit boolean return
    return !!(methodData?.parameters && methodData.parameters.length > 0);
  }

  private generateParamsInterface(
    endpoint: EndpointInfo,
    spec: SwaggerSpec,
    baseName: string
  ): GeneratedInterface | null {
    const pathData = spec.paths[endpoint.path];
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