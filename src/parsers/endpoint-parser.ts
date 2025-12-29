import { SwaggerSpec, EndpointInfo } from '../core/types';
import { NamingUtil } from '../utils/naming';

export class EndpointParser {
  parse(spec: SwaggerSpec): Map<string, EndpointInfo[]> {
    const endpointsByTag = new Map<string, EndpointInfo[]>();

    for (const [path, methods] of Object.entries(spec.paths)) {
      for (const [method, details] of Object.entries(methods)) {
        if (method === 'parameters') continue;

        const tags = details.tags || ['default'];
        const tag = NamingUtil.sanitizeTagName(tags[0]);

        if (!endpointsByTag.has(tag)) {
          endpointsByTag.set(tag, []);
        }

        const endpoint: EndpointInfo = {
          path,
          method: method.toUpperCase(),
          operationId: details.operationId,
          tag,
          summary: details.summary,
        };

        endpointsByTag.get(tag)!.push(endpoint);
      }
    }

    return endpointsByTag;
  }
}