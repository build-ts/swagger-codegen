// src/generators/hooks-generator.ts (complete update)
import { EndpointInfo, HookOptions } from '../core/types';
import { FileWriter } from '../writers/file-writer';
import { NamingUtil } from '../utils/naming';
import { Logger } from '../utils/logger';

export class HooksGenerator {
  private fileWriter: FileWriter;
  private options: HookOptions;

  constructor(outputDir: string, options: HookOptions) {
    this.fileWriter = new FileWriter(outputDir);
    this.options = options;
  }

  generate(endpointsByTag: Map<string, EndpointInfo[]>) {
    if (!this.options.generateHooks) {
      return;
    }

    Logger.step(`Generating React hooks (${this.options.hookPattern}, ${this.options.useFetch ? 'fetch' : 'axios'})...`);

    for (const [tag, endpoints] of endpointsByTag.entries()) {
      if (this.options.hookPattern === 'separate') {
        this.generateSeparateHooks(tag, endpoints);
      } else if (this.options.hookPattern === 'combined') {
        this.generateCombinedHook(tag, endpoints);
      }
    }

    Logger.success('React hooks generated');
  }

  private generateSeparateHooks(tag: string, endpoints: EndpointInfo[]) {
    for (const endpoint of endpoints) {
      const hookContent = this.generateSingleHook(tag, endpoint);
      const hookFileName = this.getHookFileName(endpoint);
      this.fileWriter.writeFile(`${tag}/${hookFileName}.ts`, hookContent);
    }
  }

  private getHookFileName(endpoint: EndpointInfo): string {
    const methodName = this.getMethodName(endpoint);
    return `use${NamingUtil.capitalize(methodName)}`;
  }

  private getMethodName(endpoint: EndpointInfo): string {
    // Əgər operationId varsa, onu istifadə et
    if (endpoint.operationId) {
      return NamingUtil.camelCase(endpoint.operationId);
    }

    // Əks halda path və method-dan yarat
    const method = endpoint.method.toLowerCase();
    const resourceName = this.extractResourceName(endpoint.path);
    
    // Path parametrləri varsa əlavə et
    const pathParams = this.extractPathParams(endpoint.path);
    
    if (pathParams.length > 0) {
      // /customers/{id} -> getCustomerById
      const paramSuffix = pathParams.map(p => `By${NamingUtil.capitalize(p)}`).join('');
      return `${method}${resourceName}${paramSuffix}`;
    }
    
    // /customers -> getCustomers
    return `${method}${resourceName}`;
  }

  private extractResourceName(path: string): string {
    // /api/customers/{id} -> Customers
    // /api/orders/{orderId}/items -> OrderItems
    const parts = path
      .split('/')
      .filter(p => p && p !== 'api' && !p.startsWith('{'));
    
    if (parts.length === 0) return 'Resource';
    
    // Son iki part-ı birləşdir (nested resources üçün)
    const relevantParts = parts.slice(-2);
    return relevantParts.map(p => NamingUtil.capitalize(NamingUtil.singularize(p))).join('');
  }

  private extractPathParams(path: string): string[] {
    // /customers/{id}/orders/{orderId} -> ['id', 'orderId']
    const regex = /{([^}]+)}/g;
    const params: string[] = [];
    let match;
    
    while ((match = regex.exec(path)) !== null) {
      params.push(match[1]);
    }
    
    return params;
  }

  private generateSingleHook(tag: string, endpoint: EndpointInfo): string {
    const method = endpoint.method.toUpperCase();
    const methodLower = method.toLowerCase();
    const methodName = this.getMethodName(endpoint);
    const baseName = endpoint.operationId 
      ? NamingUtil.pascalCase(endpoint.operationId)
      : this.extractResourceName(endpoint.path);

    const hookName = `use${NamingUtil.capitalize(methodName)}`;
    const returnTypeName = `TUse${NamingUtil.pascalCase(methodName)}`;
    
    // Determine types
    const requestType = method !== 'GET' && method !== 'DELETE' ? `I${baseName}Request` : 'void';
    const responseType = `I${baseName}Response`;
    const paramsType = method === 'GET' ? `I${baseName}Params` : 'void';

    const hasParams = method === 'GET';
    const hasBody = method !== 'GET' && method !== 'DELETE';

    // Generate imports
    const imports = this.generateImports(tag, hasBody, hasParams, requestType, responseType, paramsType);

    return `${imports}

type ${returnTypeName} = {
  data: ${responseType} | null;
  isLoading: boolean;
  error: string | null;
  ${methodName}: (${this.getMethodParams(hasBody, hasParams, requestType, paramsType)}) => Promise<${responseType} | null>;
};

export const ${hookName} = (): ${returnTypeName} => {
  const [data, setData] = useState<${responseType} | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const ${methodName} = async (${this.getMethodParams(hasBody, hasParams, requestType, paramsType)}) => {
    setIsLoading(true);
    setError(null);
    
    try {
      ${this.generateRequestCall(method, hasBody, hasParams, responseType, requestType, tag, endpoint)}
      
      setData(response);
      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);
      console.error('${hookName} error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { data, isLoading, error, ${methodName} };
};
`;
  }

  private generateImports(
    tag: string, 
    hasBody: boolean, 
    hasParams: boolean, 
    requestType: string, 
    responseType: string, 
    paramsType: string
  ): string {
    const imports: string[] = [];

    // React import
    imports.push(`import { useState } from 'react';`);

    // Axios import (only if not using fetch)
    if (!this.options.useFetch) {
      imports.push(`import { axiosInstance } from '../../config/axiosInstance';`);
    }

    // Endpoints import
    imports.push(`import { ${tag}Endpoints } from '../../endpoints/${tag}';`);

    // Model imports
    const modelImports: string[] = [];
    if (hasBody && requestType !== 'void') {
      modelImports.push(requestType);
    }
    modelImports.push(responseType);
    if (hasParams && paramsType !== 'void') {
      modelImports.push(paramsType);
    }

    if (modelImports.length > 0) {
      imports.push(`import { ${modelImports.join(', ')} } from '../../models/${tag}';`);
    }

    return imports.join('\n');
  }

  private getMethodParams(hasBody: boolean, hasParams: boolean, requestType: string, paramsType: string): string {
    const params: string[] = [];
    
    if (hasBody) {
      params.push(`payload: ${requestType}`);
    }
    
    if (hasParams) {
      params.push(`params?: ${paramsType}`);
    }

    if (this.options.includeHeaders) {
      params.push('headers?: Record<string, string>');
    }

    return params.join(', ');
  }

  private generateRequestCall(
    method: string,
    hasBody: boolean,
    hasParams: boolean,
    responseType: string,
    requestType: string,
    tag: string,
    endpoint: EndpointInfo
  ): string {
    if (this.options.useFetch) {
      return this.generateFetchCall(method, hasBody, hasParams, responseType, tag, endpoint);
    } else {
      return this.generateAxiosCall(method, hasBody, hasParams, responseType, requestType, tag, endpoint);
    }
  }

  private generateAxiosCall(
    method: string,
    hasBody: boolean,
    hasParams: boolean,
    responseType: string,
    requestType: string,
    tag: string,
    endpoint: EndpointInfo
  ): string {
    const endpointKey = this.getEndpointKey(endpoint);
    const methodLower = method.toLowerCase();

    let requestCall = `const response = await axiosInstance.${methodLower}<`;

    // Type parameters
    if (hasBody) {
      requestCall += `${requestType}, `;
    }
    requestCall += `${responseType}>(\n        ${tag}Endpoints.${endpointKey}.path`;

    // Add body
    if (hasBody) {
      requestCall += ',\n        payload';
    }

    // Add config
    const configParts: string[] = [];
    
    if (hasParams) {
      configParts.push('params');
    }
    
    if (this.options.includeHeaders) {
      configParts.push('headers');
    }

    if (configParts.length > 0) {
      requestCall += ',\n        {\n';
      if (hasParams) {
        requestCall += '          params,\n';
      }
      if (this.options.includeHeaders) {
        requestCall += '          headers,\n';
      }
      requestCall += '        }';
    }

    requestCall += '\n      );';

    return requestCall;
  }

  private generateFetchCall(
    method: string,
    hasBody: boolean,
    hasParams: boolean,
    responseType: string,
    tag: string,
    endpoint: EndpointInfo
  ): string {
    const endpointKey = this.getEndpointKey(endpoint);
    
    // Build URL with query params
    let urlConstruction = `let url = \`\${process.env.REACT_APP_API_URL || ''}\${${tag}Endpoints.${endpointKey}.path}\`;`;
    
    if (hasParams) {
      urlConstruction += `\n      
      // Add query params
      if (params) {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
        const queryString = queryParams.toString();
        if (queryString) {
          url += \`?\${queryString}\`;
        }
      }`;
    }

    // Build fetch options
    let fetchOptions = `
      const fetchOptions: RequestInit = {
        method: '${method}',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',`;

    if (this.options.includeHeaders) {
      fetchOptions += `\n          ...headers,`;
    }

    fetchOptions += `
        },`;

    if (hasBody) {
      fetchOptions += `
        body: JSON.stringify(payload),`;
    }

    fetchOptions += `
      };`;

    // Fetch call
    const fetchCall = `${urlConstruction}
${fetchOptions}

      const fetchResponse = await fetch(url, fetchOptions);
      
      if (!fetchResponse.ok) {
        throw new Error(\`HTTP error! status: \${fetchResponse.status}\`);
      }
      
      const response: ${responseType} = await fetchResponse.json();`;

    return fetchCall;
  }

  private getEndpointKey(endpoint: EndpointInfo): string {
    if (endpoint.operationId) {
      return NamingUtil.camelCase(endpoint.operationId);
    }

    const methodName = this.getMethodName(endpoint);
    return methodName;
  }

  private generateCombinedHook(tag: string, endpoints: EndpointInfo[]): string {
    Logger.step(`Generating combined hook for ${tag}...`);

    const hookName = `use${NamingUtil.pascalCase(tag)}`;
    const hookContent = this.generateCombinedHookContent(tag, endpoints, hookName);
    
    this.fileWriter.writeFile(`${tag}/${hookName}.ts`, hookContent);
    
    return hookContent;
  }

  private generateCombinedHookContent(tag: string, endpoints: EndpointInfo[], hookName: string): string {
    // Generate imports
    const imports = this.generateCombinedImports(tag, endpoints);
    
    // Generate state declarations
    const stateDeclarations = this.generateCombinedStateDeclarations(endpoints);
    
    // Generate methods
    const methods = this.generateCombinedMethods(tag, endpoints);
    
    // Generate return type
    const returnType = this.generateCombinedReturnType(hookName, endpoints);
    
    // Generate return statement
    const returnStatement = this.generateCombinedReturnStatement(endpoints);

    return `${imports}

${returnType}

export const ${hookName} = (): ${hookName}Return => {
${stateDeclarations}

${methods}

  return {
${returnStatement}
  };
};
`;
  }

  private generateCombinedImports(tag: string, endpoints: EndpointInfo[]): string {
    const imports: string[] = [];
    
    // React import
    imports.push(`import { useState } from 'react';`);
    
    // Axios or fetch
    if (!this.options.useFetch) {
      imports.push(`import { axiosInstance } from '../config/axiosInstance';`);
    }
    
    // Endpoints
    imports.push(`import { ${tag}Endpoints } from '../endpoints/${tag}';`);
    
    // Collect all unique types
    const typeSet = new Set<string>();
    
    for (const endpoint of endpoints) {
      const baseName = endpoint.operationId 
        ? NamingUtil.pascalCase(endpoint.operationId)
        : this.extractResourceName(endpoint.path);
      
      const method = endpoint.method.toUpperCase();
      
      // Request types
      if (method !== 'GET' && method !== 'DELETE') {
        typeSet.add(`I${baseName}Request`);
      }
      
      // Response types
      typeSet.add(`I${baseName}Response`);
      
      // Params types
      if (method === 'GET') {
        typeSet.add(`I${baseName}Params`);
      }
    }
    
    if (typeSet.size > 0) {
      imports.push(`import { ${Array.from(typeSet).join(', ')} } from '../models/${tag}';`);
    }
    
    return imports.join('\n');
  }

  private generateCombinedStateDeclarations(endpoints: EndpointInfo[]): string {
    const states: string[] = [];
    
    for (const endpoint of endpoints) {
      const baseName = endpoint.operationId 
        ? NamingUtil.pascalCase(endpoint.operationId)
        : this.extractResourceName(endpoint.path);
      
      const methodName = this.getMethodName(endpoint);
      const responseType = `I${baseName}Response`;
      
      // Each endpoint gets its own state
      states.push(`  const [${methodName}Data, set${NamingUtil.pascalCase(methodName)}Data] = useState<${responseType} | null>(null);`);
      states.push(`  const [${methodName}Loading, set${NamingUtil.pascalCase(methodName)}Loading] = useState<boolean>(false);`);
      states.push(`  const [${methodName}Error, set${NamingUtil.pascalCase(methodName)}Error] = useState<string | null>(null);`);
      states.push('');
    }
    
    return states.join('\n');
  }

  private generateCombinedMethods(tag: string, endpoints: EndpointInfo[]): string {
    const methods: string[] = [];
    
    for (const endpoint of endpoints) {
      const method = endpoint.method.toUpperCase();
      const baseName = endpoint.operationId 
        ? NamingUtil.pascalCase(endpoint.operationId)
        : this.extractResourceName(endpoint.path);
      
      const methodName = this.getMethodName(endpoint);
      const responseType = `I${baseName}Response`;
      const requestType = method !== 'GET' && method !== 'DELETE' ? `I${baseName}Request` : null;
      const paramsType = method === 'GET' ? `I${baseName}Params` : null;
      
      // Method signature
      const params: string[] = [];
      if (requestType) {
        params.push(`payload: ${requestType}`);
      }
      if (paramsType) {
        params.push(`params?: ${paramsType}`);
      }
      if (this.options.includeHeaders) {
        params.push('headers?: Record<string, string>');
      }
      
      methods.push(`  const ${methodName} = async (${params.join(', ')}): Promise<${responseType} | null> => {`);
      methods.push(`    set${NamingUtil.pascalCase(methodName)}Loading(true);`);
      methods.push(`    set${NamingUtil.pascalCase(methodName)}Error(null);`);
      methods.push('    ');
      methods.push('    try {');
      
      // Generate request call
      const hasBody = requestType !== null;
      const hasParams = paramsType !== null;
      const requestCall = this.generateRequestCall(
        method,
        hasBody,
        hasParams,
        responseType,
        requestType || 'void',
        tag,
        endpoint
      );
      
      methods.push(`      ${requestCall.split('\n').join('\n      ')}`);
      methods.push('      ');
      methods.push(`      set${NamingUtil.pascalCase(methodName)}Data(response);`);
      methods.push('      return response;');
      methods.push('    } catch (err: any) {');
      methods.push(`      const errorMessage = err.message || 'An error occurred';`);
      methods.push(`      set${NamingUtil.pascalCase(methodName)}Error(errorMessage);`);
      methods.push(`      console.error('${methodName} error:', err);`);
      methods.push('      return null;');
      methods.push('    } finally {');
      methods.push(`      set${NamingUtil.pascalCase(methodName)}Loading(false);`);
      methods.push('    }');
      methods.push('  };');
      methods.push('');
    }
    
    return methods.join('\n');
  }

  private generateCombinedReturnType(hookName: string, endpoints: EndpointInfo[]): string {
    const properties: string[] = [];
    
    for (const endpoint of endpoints) {
      const baseName = endpoint.operationId 
        ? NamingUtil.pascalCase(endpoint.operationId)
        : this.extractResourceName(endpoint.path);
      
      const methodName = this.getMethodName(endpoint);
      const responseType = `I${baseName}Response`;
      const requestType = endpoint.method !== 'GET' && endpoint.method !== 'DELETE' 
        ? `I${baseName}Request` 
        : null;
      const paramsType = endpoint.method === 'GET' ? `I${baseName}Params` : null;
      
      // State properties
      properties.push(`  ${methodName}Data: ${responseType} | null;`);
      properties.push(`  ${methodName}Loading: boolean;`);
      properties.push(`  ${methodName}Error: string | null;`);
      
      // Method signature
      const params: string[] = [];
      if (requestType) {
        params.push(`payload: ${requestType}`);
      }
      if (paramsType) {
        params.push(`params?: ${paramsType}`);
      }
      if (this.options.includeHeaders) {
        params.push('headers?: Record<string, string>');
      }
      
      properties.push(`  ${methodName}: (${params.join(', ')}) => Promise<${responseType} | null>;`);
    }
    
    return `type ${hookName}Return = {
${properties.join('\n')}
};`;
  }

  private generateCombinedReturnStatement(endpoints: EndpointInfo[]): string {
    const returns: string[] = [];
    
    for (const endpoint of endpoints) {
      const methodName = this.getMethodName(endpoint);
      
      returns.push(`    ${methodName}Data,`);
      returns.push(`    ${methodName}Loading,`);
      returns.push(`    ${methodName}Error,`);
      returns.push(`    ${methodName},`);
    }
    
    return returns.join('\n');
  }
}