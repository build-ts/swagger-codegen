import {
  SwaggerSpec,
  EndpointInfo,
  ResolvedGeneratorConfig,
} from "../core/types";
import { NamingUtil } from "../utils/naming";

interface PathMethod {
  tags?: string[];
  operationId?: string;
  summary?: string;
  description?: string;
  parameters?: any[];
  requestBody?: any;
  responses?: any;
  [key: string]: any;
}

export class EndpointParser {
  /**
   * Parse Swagger spec and extract endpoints with cleaned paths
   */
  parse(
    spec: SwaggerSpec,
    config: ResolvedGeneratorConfig
  ): Map<string, EndpointInfo[]> {
    const endpointsByTag = new Map<string, EndpointInfo[]>();
    const stripPaths = this.normalizeStripPaths(config.stripBasePath);

    for (const [path, methods] of Object.entries(spec.paths)) {
      for (const [method, details] of Object.entries(
        methods as Record<string, PathMethod>
      )) {
        // Skip parameter definitions
        if (method === "parameters") continue;

        // Now TypeScript knows 'details' is PathMethod
        const tags = details.tags || ["default"];
        const tag = NamingUtil.sanitizeTagName(tags[0]);

        if (!endpointsByTag.has(tag)) {
          endpointsByTag.set(tag, []);
        }

        const cleanedPath = NamingUtil.stripBasePath(path, stripPaths);

        const endpoint: EndpointInfo = {
          path: cleanedPath,
          originalPath: path,
          method: method.toUpperCase(),
          operationId: details.operationId || "",
          tag,
          summary: details.summary,
          description: details.description,
        };

        endpointsByTag.get(tag)!.push(endpoint);
      }
    }

    return endpointsByTag;
  }

  /**
   * Normalize stripBasePath config to array
   */
  private normalizeStripPaths(stripBasePath?: string | string[]): string[] {
    if (!stripBasePath) return [];
    return Array.isArray(stripBasePath) ? stripBasePath : [stripBasePath];
  }

  /**
   * Extract path parameters from endpoint path
   * /categories/{id}/items/{itemId} -> ['id', 'itemId']
   */
  static extractPathParams(path: string): string[] {
    const params: string[] = [];
    const regex = /\{([^}]+)\}/g;
    let match;

    while ((match = regex.exec(path)) !== null) {
      params.push(match[1]);
    }

    return params;
  }

  /**
   * Check if endpoint has path parameters
   */
  static hasPathParams(path: string): boolean {
    return path.includes('{') || path.includes(':');
  }

  /**
   * Replace path params with colon syntax for easier reading
   * /categories/{id} -> /categories/:id
   */
  static normalizePathParams(path: string): string {
    return path.replace(/\{([^}]+)\}/g, ':$1');
  }

  /**
   * Get path parameters with their positions
   * /categories/{categoryId}/items/{itemId} -> [{name: 'categoryId', index: 0}, {name: 'itemId', index: 1}]
   */
  static getPathParamsWithIndex(path: string): Array<{name: string; index: number}> {
    const params = this.extractPathParams(path);
    return params.map((name, index) => ({ name, index }));
  }

  /**
   * Build path with parameters replaced
   * (/categories/{id}, {id: 123}) -> /categories/123
   */
  static buildPath(path: string, params: Record<string, string | number>): string {
    let builtPath = path;
    for (const [key, value] of Object.entries(params)) {
      builtPath = builtPath.replace(`{${key}}`, String(value));
    }
    return builtPath;
  }
}