import { EndpointInfo } from '../core/types';
import { FileWriter } from '../writers/file-writer';
import { NamingUtil } from '../utils/naming';
import { Logger } from '../utils/logger';

export class EndpointGenerator {
  private fileWriter: FileWriter;

  constructor(outputDir: string) {
    this.fileWriter = new FileWriter(outputDir);
  }

  generate(endpointsByTag: Map<string, EndpointInfo[]>) {
    Logger.step('Generating endpoint definitions...');

    for (const [tag, endpoints] of endpointsByTag.entries()) {
      this.generateTagEndpoints(tag, endpoints);
    }

    Logger.success('Endpoint generation completed');
  }

  private generateTagEndpoints(tag: string, endpoints: EndpointInfo[]) {
    const endpointObject: Record<string, any> = {};

    for (const endpoint of endpoints) {
      const key = this.getEndpointKey(endpoint);
      
      endpointObject[key] = {
        path: endpoint.path,
        method: endpoint.method,
        ...(endpoint.summary && { summary: endpoint.summary }),
      };
    }

    const content = this.generateEndpointFile(tag, endpointObject);
    this.fileWriter.writeFile(`${tag}.ts`, content);
  }

  private getEndpointKey(endpoint: EndpointInfo): string {
    if (endpoint.operationId) {
      return NamingUtil.camelCase(endpoint.operationId);
    }

    // path-dan key yarat: /api/customers/{id} -> getCustomersById
    const pathParts = endpoint.path
      .split('/')
      .filter(p => p && p !== 'api')
      .map(p => p.startsWith('{') ? 'by' + NamingUtil.capitalize(p.slice(1, -1)) : p);

    return NamingUtil.camelCase(`${endpoint.method}_${pathParts.join('_')}`);
  }

  private generateEndpointFile(tag: string, endpoints: Record<string, any>): string {
    const tagName = NamingUtil.pascalCase(tag);

    return `/**
 * ${tagName} Endpoints
 * Auto-generated from Swagger specification
 */

export interface Endpoint {
  path: string;
  method: string;
  summary?: string;
}

export const ${NamingUtil.camelCase(tag)}Endpoints = ${JSON.stringify(endpoints, null, 2)} as const;

export type ${tagName}EndpointKeys = keyof typeof ${NamingUtil.camelCase(tag)}Endpoints;
`;
  }
}