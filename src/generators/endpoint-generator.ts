import { EndpointInfo, ResolvedGeneratorConfig, SwaggerSpec } from '../core/types';
import { FileWriter } from '../writers/file-writer';
import { NamingUtil } from '../utils/naming';
import { Logger } from '../utils/logger';
import { EndpointParser } from '../parsers/endpoint-parser';

export class EndpointGenerator {
  private fileWriter: FileWriter;
  private spec: SwaggerSpec | null = null;

  constructor(outputDir: string) {
    this.fileWriter = new FileWriter(outputDir);
  }

  generate(
    endpointsByTag: Map<string, EndpointInfo[]>,
    config: ResolvedGeneratorConfig,
    spec: SwaggerSpec
  ) {
    Logger.step('Generating endpoint definitions...');
    this.spec = spec;

    for (const [tag, endpoints] of endpointsByTag.entries()) {
      this.generateTagEndpoints(tag, endpoints);
    }

    Logger.success('Endpoint generation completed');
  }

  private generateTagEndpoints(tag: string, endpoints: EndpointInfo[]) {
    const content = this.generateEndpointsFile(tag, endpoints);
    this.fileWriter.writeFile(`${tag}.ts`, content, false);
  }

  private generateEndpointsFile(tag: string, endpoints: EndpointInfo[]): string {
    const tagName = NamingUtil.pascalCase(tag);
    
    let content = `/**\n * ${tagName} Endpoints\n * Auto-generated from Swagger specification\n */\n\n`;
    
    // Generate endpoint functions
    content += `export const ${tag}Endpoints = {\n`;

    for (const endpoint of endpoints) {
      const methodName = this.getMethodName(endpoint);
      const pathParams = EndpointParser.extractPathParams(endpoint.path);
      const queryParams = this.extractQueryParams(endpoint);
      
      content += this.generateEndpointFunction(
        methodName,
        endpoint,
        pathParams,
        queryParams
      );
    }

    content += `} as const;\n\n`;

    // Generate metadata type
    content += this.generateMetadataType(tag, endpoints);

    return content;
  }

  private generateEndpointFunction(
    methodName: string,
    endpoint: EndpointInfo,
    pathParams: string[],
    queryParams: string[]
  ): string {
    const hasPathParams = pathParams.length > 0;
    const hasQueryParams = queryParams.length > 0;
    
    // No params - simple function
    if (!hasPathParams && !hasQueryParams) {
      return `  ${methodName}: () => '${endpoint.path}',\n`;
    }

    // Generate function signature
    let signature = '  ';
    signature += methodName;
    signature += ': (';

    const params: string[] = [];
    
    // Path params (required)
    if (hasPathParams) {
      for (const param of pathParams) {
        params.push(`${param}: string | number`);
      }
    }

    // Query params (optional object)
    if (hasQueryParams) {
      const queryParamTypes = queryParams.map(p => `${p}?: string | number | boolean`).join('; ');
      params.push(`params?: { ${queryParamTypes} }`);
    }

    signature += params.join(', ');
    signature += ') => {\n';

    // Generate function body
    let body = '';
    
    // Build path
    let pathTemplate = endpoint.path;
    for (const param of pathParams) {
      pathTemplate = pathTemplate.replace(`{${param}}`, `\${${param}}`);
    }
    
    body += `    const path = \`${pathTemplate}\`;\n`;

    // Add query params if exist
    if (hasQueryParams) {
      body += `    if (!params) return path;\n`;
      body += `    const queryString = new URLSearchParams(\n`;
      body += `      Object.entries(params)\n`;
      body += `        .filter(([_, v]) => v !== undefined && v !== null)\n`;
      body += `        .map(([k, v]) => [k, String(v)])\n`;
      body += `    ).toString();\n`;
      body += `    return queryString ? \`\${path}?\${queryString}\` : path;\n`;
    } else {
      body += `    return path;\n`;
    }

    body += `  },\n`;

    return signature + body;
  }

  private generateMetadataType(tag: string, endpoints: EndpointInfo[]): string {
    const tagName = NamingUtil.pascalCase(tag);
    
    let content = `export const ${tag}Metadata = {\n`;

    for (const endpoint of endpoints) {
      const methodName = this.getMethodName(endpoint);
      
      content += `  ${methodName}: {\n`;
      content += `    method: '${endpoint.method}' as const,\n`;
      
      if (endpoint.summary) {
        content += `    summary: '${endpoint.summary.replace(/'/g, "\\'")}',\n`;
      }
      
      content += `  },\n`;
    }

    content += `} as const;\n\n`;
    content += `export type ${tagName}EndpointKeys = keyof typeof ${tag}Endpoints;\n`;

    return content;
  }

  private getMethodName(endpoint: EndpointInfo): string {
    if (endpoint.operationId) {
      return NamingUtil.getMethodName(endpoint.operationId);
    }

    const method = endpoint.method.toLowerCase();
    const resource = NamingUtil.getResourceFromPath(endpoint.path);
    const resourcePascal = NamingUtil.pascalCase(resource);
    
    return `${method}${resourcePascal}`;
  }

  private extractQueryParams(endpoint: EndpointInfo): string[] {
    if (!this.spec) return [];

    const pathData = this.spec.paths[endpoint.originalPath || endpoint.path];
    const methodData = pathData?.[endpoint.method.toLowerCase()];
    const parameters = methodData?.parameters || [];

    const queryParams: string[] = [];

    for (const param of parameters) {
      if (param.in === 'query') {
        queryParams.push(param.name);
      }
    }

    return queryParams;
  }
}