import { EndpointInfo, ResolvedGeneratorConfig } from '../core/types';
import { FileWriter } from '../writers/file-writer';
import { NamingUtil } from '../utils/naming';
import { Logger } from '../utils/logger';
import path from 'path';

export class IndexGenerator {
  private outputDir: string;
  private fileWriter: FileWriter;

  constructor(outputDir: string) {
    this.outputDir = outputDir;
    this.fileWriter = new FileWriter(outputDir);
  }

  /**
   * Main generate method - called from Generator
   */
  generate(endpointsByTag: Map<string, EndpointInfo[]>, config: ResolvedGeneratorConfig) {
    Logger.step('Generating index files...');

    const tags = Array.from(endpointsByTag.keys());

    // Generate models index
    this.generateModelIndex(tags, config);

    // Generate endpoints index
    this.generateEndpointIndex(tags, config);

    // Generate hooks index (if enabled)
    if (config.hooks.generateHooks) {
      this.generateHooksIndex(tags, config);
    }

    Logger.success('Index files generated');
  }

  private generateModelIndex(tags: string[], config: ResolvedGeneratorConfig) {
    const exports = tags.map(tag => {
      return `export * from './${tag}';`;
    }).join('\n');

    const modelsIndexPath = path.join(config.modelsDir, 'index.ts');
    this.fileWriter.writeFile(modelsIndexPath, exports, true);
  }

  private generateEndpointIndex(tags: string[], config: ResolvedGeneratorConfig) {
    const exports = tags.map(tag => {
      const camelTag = NamingUtil.camelCase(tag);
      return `export { ${camelTag}Endpoints, ${camelTag}Metadata } from './${tag}';`;
    }).join('\n');

    const endpointsObject = tags.map(tag => {
      const camelTag = NamingUtil.camelCase(tag);
      return `  ${camelTag}: ${camelTag}Endpoints,`;
    }).join('\n');

    const content = `${exports}

export const endpoints = {
${endpointsObject}
} as const;
`;

    const endpointsIndexPath = path.join(config.endpointsDir, 'index.ts');
    this.fileWriter.writeFile(endpointsIndexPath, content, true);
  }

  private generateHooksIndex(tags: string[], config: ResolvedGeneratorConfig) {
    const exports: string[] = [];

    for (const tag of tags) {
      exports.push(`export * from './${tag}';`);
    }

    const content = exports.join('\n') + '\n';

    const hooksIndexPath = path.join(config.hooks.hooksDir, 'index.ts');
    this.fileWriter.writeFile(hooksIndexPath, content, true);
  }

  /**
   * Legacy method - kept for backward compatibility
   */
  generateModelIndex_old(tags: string[]) {
    Logger.step('Generating models index...');

    const exports = tags.map(tag => {
      return `export * from './${tag}';`;
    }).join('\n');

    this.fileWriter.writeFile('index.ts', exports, true);
    Logger.success('Models index generated');
  }

  /**
   * Legacy method - kept for backward compatibility
   */
  generateEndpointIndex_old(tags: string[]) {
    Logger.step('Generating endpoints index...');

    const exports = tags.map(tag => {
      const camelTag = NamingUtil.camelCase(tag);
      return `export { ${camelTag}Endpoints } from './${tag}';`;
    }).join('\n');

    const content = `${exports}

export const endpoints = {
${tags.map(tag => `  ${NamingUtil.camelCase(tag)}: ${NamingUtil.camelCase(tag)}Endpoints,`).join('\n')}
} as const;
`;

    this.fileWriter.writeFile('index.ts', content, true);
    Logger.success('Endpoints index generated');
  }
}