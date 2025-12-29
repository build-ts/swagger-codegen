import fs from 'fs';
import path from 'path';
import { UserGeneratorConfig } from '../core/types';
import { Logger } from './logger';

export class ConfigLoader {
  private static CONFIG_FILES = [
    'swagger-codegen.config.js',
    'swagger-codegen.config.json',
    'swagger-codegen.config.ts',
  ];

  static async loadConfig(configPath?: string): Promise<UserGeneratorConfig | null> {
    if (configPath) {
      return this.loadFromPath(configPath);
    }

    // Try to find config file in current directory
    for (const fileName of this.CONFIG_FILES) {
      const fullPath = path.resolve(process.cwd(), fileName);
      
      if (fs.existsSync(fullPath)) {
        Logger.info(`Found config file: ${fileName}`);
        return this.loadFromPath(fullPath);
      }
    }

    return null;
  }

  private static async loadFromPath(configPath: string): Promise<UserGeneratorConfig> {
    const fullPath = path.resolve(process.cwd(), configPath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`Config file not found: ${fullPath}`);
    }

    const ext = path.extname(fullPath);

    if (ext === '.json') {
      return this.loadJsonConfig(fullPath);
    } else if (ext === '.js' || ext === '.ts') {
      return this.loadJsConfig(fullPath);
    } else {
      throw new Error(`Unsupported config file format: ${ext}. Use .js, .json, or .ts`);
    }
  }

  private static loadJsonConfig(filePath: string): UserGeneratorConfig {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to parse JSON config: ${(error as Error).message}`);
    }
  }

  private static async loadJsConfig(filePath: string): Promise<UserGeneratorConfig> {
    try {
      // Clear require cache to allow reload
      delete require.cache[require.resolve(filePath)];

      // For .ts files
      if (filePath.endsWith('.ts')) {
        try {
          require('ts-node/register');
        } catch {
          Logger.warning(
            'TypeScript config detected but ts-node is not installed. ' +
            'Install it with: npm install -D ts-node'
          );
        }
      }

      const config = require(filePath);
      
      // Support both module.exports and export default
      return config.default || config;
    } catch (error) {
      throw new Error(`Failed to load config from ${filePath}: ${(error as Error).message}`);
    }
  }
}