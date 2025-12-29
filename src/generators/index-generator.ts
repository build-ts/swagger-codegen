// src/generators/index-generator.ts
import { FileWriter } from '../writers/file-writer';
import { NamingUtil } from '../utils/naming';
import { Logger } from '../utils/logger';

export class IndexGenerator {
  private fileWriter: FileWriter;

  constructor(outputDir: string) {
    this.fileWriter = new FileWriter(outputDir);
  }

  generateModelIndex(tags: string[]) {
    Logger.step('Generating models index...');

    const exports = tags.map(tag => {
      return `export * from './${tag}';`;
    }).join('\n');

    this.fileWriter.writeFile('index.ts', exports);
    Logger.success('Models index generated');
  }

  generateEndpointIndex(tags: string[]) {
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

    this.fileWriter.writeFile('index.ts', content);
    Logger.success('Endpoints index generated');
  }
}