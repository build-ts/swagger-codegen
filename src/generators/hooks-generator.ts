import { EndpointInfo, ResolvedGeneratorConfig } from "../core/types";
import { FileWriter } from "../writers/file-writer";
import { NamingUtil } from "../utils/naming";
import { Logger } from "../utils/logger";
import { EndpointParser } from "../parsers/endpoint-parser";
import path from "path";

export class HooksGenerator {
  private fileWriter: FileWriter;

  constructor(outputDir: string) {
    this.fileWriter = new FileWriter(outputDir);
  }

  generate(
    endpointsByTag: Map<string, EndpointInfo[]>,
    config: ResolvedGeneratorConfig
  ) {
    Logger.step("Generating React hooks...");

    if (config.hooks.hookPattern === "combined") {
      this.generateCombinedHooks(endpointsByTag, config);
    } else {
      this.generateSeparateHooks(endpointsByTag, config);
    }

    Logger.success("React hooks generated successfully");
  }

  /**
   * Generate separate hook file for each endpoint
   */
  private generateSeparateHooks(
    endpointsByTag: Map<string, EndpointInfo[]>,
    config: ResolvedGeneratorConfig
  ) {
    for (const [tag, endpoints] of endpointsByTag.entries()) {
      for (const endpoint of endpoints) {
        // ✅ Skip if no operationId
        if (!endpoint.operationId) {
          Logger.warning(
            `Skipping hook for ${endpoint.method} ${endpoint.path} - no operationId`
          );
          continue;
        }

        const hookContent = this.generateSeparateHook(endpoint, tag, config);

        // ✅ Skip empty hooks
        if (!hookContent) continue;

        const hookName = NamingUtil.getHookName(endpoint.operationId);
        const fileName = `${hookName}.ts`;
        const filePath = path.join(tag, fileName);

        this.fileWriter.writeFile(filePath, hookContent, false);
      }
    }
  }

  /**
   * Generate a separate hook for single endpoint
   */
  private generateSeparateHook(
    endpoint: EndpointInfo,
    tag: string,
    config: ResolvedGeneratorConfig
  ): string {
    if (!endpoint.operationId) {
      Logger.warning(
        `Endpoint ${endpoint.path} has no operationId, skipping hook generation`
      );
      return "";
    }
    const hookName = NamingUtil.getHookName(endpoint.operationId);
    const methodName = NamingUtil.getMethodName(endpoint.operationId);
    const resourceName = NamingUtil.extractResourceName(endpoint.operationId);
    const endpointKey = methodName; // Same as endpoint function name

    const hasBody = ["POST", "PUT", "PATCH"].includes(endpoint.method);
    const pathParams = EndpointParser.extractPathParams(endpoint.path);
    const hasPathParams = pathParams.length > 0;

    // Type names
    const responseType = `I${resourceName}Response`;
    const paramsType =
      endpoint.method === "GET" || hasPathParams
        ? `I${resourceName}Params`
        : "";
    const requestType = hasBody ? `I${resourceName}Request` : "";

    // Generate imports
    const imports = this.generateImports(tag, resourceName, {
      hasResponse: true,
      hasParams: !!paramsType,
      hasRequest: !!requestType,
    });

    // Generate type definition
    const typeDefinition = this.generateTypeDefinition(
      hookName,
      methodName,
      responseType,
      requestType,
      paramsType,
      pathParams,
      config
    );

    // Generate hook body
    const hookBody = this.generateHookBody(
      hookName,
      methodName,
      endpoint,
      tag,
      endpointKey,
      responseType,
      requestType,
      paramsType,
      pathParams,
      config
    );

    return imports + "\n" + typeDefinition + "\n" + hookBody;
  }

  /**
   * Generate type definition for hook
   */
  private generateTypeDefinition(
    hookName: string,
    methodName: string,
    responseType: string,
    requestType: string,
    paramsType: string,
    pathParams: string[],
    config: ResolvedGeneratorConfig
  ): string {
    const returnTypeName = `T${hookName.replace("use", "Use")}`;

    // Build method signature
    const methodParams: string[] = [];

    // Add path params first
    if (pathParams.length > 0) {
      for (const param of pathParams) {
        methodParams.push(`${param}: string | number`);
      }
    }

    // Add body/payload
    if (requestType) {
      methodParams.push(`payload: ${requestType}`);
    }

    // Add query params
    if (paramsType) {
      methodParams.push(`params?: ${paramsType}`);
    }

    // Add headers
    if (config.hooks.includeHeaders) {
      methodParams.push(`headers?: Record<string, string>`);
    }

    return `type ${returnTypeName} = {
  data: ${responseType} | null;
  isLoading: boolean;
  error: string | null;
  ${methodName}: (${methodParams.join(
      ", "
    )}) => Promise<${responseType} | null>;
};
`;
  }

  /**
   * Generate hook body
   */
  private generateHookBody(
    hookName: string,
    methodName: string,
    endpoint: EndpointInfo,
    tag: string,
    endpointKey: string,
    responseType: string,
    requestType: string,
    paramsType: string,
    pathParams: string[],
    config: ResolvedGeneratorConfig
  ): string {
    const returnTypeName = `T${hookName.replace("use", "Use")}`;
    const hasBody = !!requestType;

    // Build method signature
    const methodParams: string[] = [];

    // Path params
    if (pathParams.length > 0) {
      for (const param of pathParams) {
        methodParams.push(`${param}: string | number`);
      }
    }

    // Body
    if (requestType) {
      methodParams.push(`payload: ${requestType}`);
    }

    // Query params
    if (paramsType) {
      methodParams.push(`params?: ${paramsType}`);
    }

    // Headers
    if (config.hooks.includeHeaders) {
      methodParams.push(`headers?: Record<string, string>`);
    }

    // Generate URL building
    const urlBuilding = this.generateUrlBuilding(
      tag,
      endpointKey,
      pathParams,
      paramsType
    );

    // Generate axios call
    const axiosCall = this.generateAxiosCall(
      endpoint.method,
      hasBody,
      config.hooks.includeHeaders
    );

    return `export const ${hookName} = (): ${returnTypeName} => {
  const [data, setData] = useState<${responseType} | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const ${methodName} = async (${methodParams.join(
      ", "
    )}): Promise<${responseType} | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
${urlBuilding}
${axiosCall}
      
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

  /**
   * Detect HTTP method from endpoint name
   * getCategories -> GET
   * createCategory -> POST
   * updateCategory -> PUT
   * deleteCategory -> DELETE
   */
  private detectMethodFromName(methodName: string): string {
    const lower = methodName.toLowerCase();

    if (
      lower.startsWith("get") ||
      lower.startsWith("find") ||
      lower.startsWith("fetch") ||
      lower.startsWith("list")
    ) {
      return "get";
    } else if (
      lower.startsWith("create") ||
      lower.startsWith("add") ||
      lower.startsWith("post")
    ) {
      return "post";
    } else if (
      lower.startsWith("update") ||
      lower.startsWith("edit") ||
      lower.startsWith("modify") ||
      lower.startsWith("put")
    ) {
      return "put";
    } else if (lower.startsWith("delete") || lower.startsWith("remove")) {
      return "delete";
    } else if (lower.startsWith("patch")) {
      return "patch";
    } else if (lower.startsWith("assign")) {
      return "post"; // assign operations are usually POST
    }

    // Default fallback
    return "post";
  }
  /**
   * Generate axios call - no metadata needed
   */
  private generateAxiosCall(
    methodName: string,
    hasBody: boolean,
    includeHeaders: boolean
  ): string {
    // Detect method from endpoint name
    const axiosMethod = this.detectMethodFromName(methodName);

    if (axiosMethod === "get" || axiosMethod === "delete") {
      return `      const response = await axiosInstance.${axiosMethod}(url${
        includeHeaders ? ", { headers }" : ""
      });`;
    } else {
      return `      const response = await axiosInstance.${axiosMethod}(url, payload${
        includeHeaders ? ", { headers }" : ""
      });`;
    }
  }

  /**
   * Generate URL building code - no metadata
   */
  private generateUrlBuilding(
    tag: string,
    endpointKey: string,
    pathParams: string[],
    paramsType: string
  ): string {
    const endpointsVar = `${tag}Endpoints`;

    let code = `      // Build URL\n`;

    if (pathParams.length > 0 || paramsType) {
      const args: string[] = [];

      if (pathParams.length > 0) {
        args.push(...pathParams);
      }

      if (paramsType) {
        args.push("params");
      }

      code += `      const url = ${endpointsVar}.${endpointKey}(${args.join(
        ", "
      )});\n`;
    } else {
      code += `      const url = ${endpointsVar}.${endpointKey}();\n`;
    }

    return code;
  }

  /**
   * Generate imports - no metadata import
   */
  private generateImports(
    tag: string,
    resourceName: string,
    types: { hasResponse: boolean; hasParams: boolean; hasRequest: boolean }
  ): string {
    let imports = `import { useState } from 'react';\n`;
    imports += `import { axiosInstance } from '../../config/axiosInstance';\n`;
    imports += `import { ${tag}Endpoints } from '../../endpoints/${tag}';\n`; // ✅ No metadata

    const typeImports: string[] = [];
    if (types.hasResponse) typeImports.push(`I${resourceName}Response`);
    if (types.hasParams) typeImports.push(`I${resourceName}Params`);
    if (types.hasRequest) typeImports.push(`I${resourceName}Request`);

    if (typeImports.length > 0) {
      imports += `import { ${typeImports.join(
        ", "
      )} } from '../../models/${resourceName.toLowerCase()}';\n`;
    }

    return imports;
  }

  /**
   * Generate combined hooks (not implemented in this example)
   */
  private generateCombinedHooks(
    endpointsByTag: Map<string, EndpointInfo[]>,
    config: ResolvedGeneratorConfig
  ) {
    // Implementation similar to separate but combines all endpoints in one hook
    Logger.info(
      "Combined hooks generation not fully implemented in this example"
    );
  }
}
