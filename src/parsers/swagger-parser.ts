import { SwaggerSpec } from '../core/types';
import { Logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

export class SwaggerParser {
  async parse(source: string): Promise<SwaggerSpec> {
    Logger.step('Parsing Swagger specification...');

    let spec: SwaggerSpec;

    if (source.startsWith('http://') || source.startsWith('https://')) {
      spec = await this.fetchFromUrl(source);
    } else {
      spec = this.readFromFile(source);
    }

    this.validate(spec);
    Logger.success('Swagger specification parsed successfully');

    return spec;
  }

  private async fetchFromUrl(url: string): Promise<SwaggerSpec> {
    Logger.info(`Fetching from URL: ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch swagger spec: ${response.statusText}`);
    }

    return await response.json() as SwaggerSpec; // Cast to SwaggerSpec
  }

  private readFromFile(filePath: string): SwaggerSpec {
    Logger.info(`Reading from file: ${filePath}`);
    const fullPath = path.resolve(process.cwd(), filePath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${fullPath}`);
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    return JSON.parse(content) as SwaggerSpec; // Cast to SwaggerSpec
  }

  private validate(spec: SwaggerSpec) {
    if (!spec.paths) {
      throw new Error('Invalid Swagger spec: missing "paths" property');
    }

    if (!spec.openapi && !spec.swagger) {
      throw new Error('Invalid Swagger spec: missing version information');
    }
  }
}