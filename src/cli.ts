#!/usr/bin/env node

import { SwaggerCodeGenerator } from './core/generator';
import { UserGeneratorConfig } from './core/types';
import { ConfigLoader } from './utils/config-loader';
import { Logger } from './utils/logger';

interface ParsedArgs {
  userConfig: UserGeneratorConfig;
  configPath?: string;
}

function parseArgs(): ParsedArgs {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  if (args.includes('--version') || args.includes('-v')) {
    printVersion();
    process.exit(0);
  }

  const config: UserGeneratorConfig = { 
    swaggerUrl: '',
  };
  
  let configPath: string | undefined;

  // First argument as swagger URL
  if (args.length > 0 && !args[0].startsWith('-')) {
    config.swaggerUrl = args[0];
  }

  // Parse CLI arguments
  for (let i = args[0]?.startsWith('-') ? 0 : 1; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--output' || arg === '-o') {
      config.outputDir = args[++i];
    } else if (arg === '--models' || arg === '-m') {
      config.modelsDir = args[++i];
    } else if (arg === '--endpoints' || arg === '-e') {
      // ✅ Enable endpoints generation
      if (!config.endpoints) config.endpoints = {};
      config.endpoints.generateEndpoints = true;
      
      // Check if next arg is a directory
      if (args[i + 1] && !args[i + 1].startsWith('-')) {
        config.endpointsDir = args[++i];
      }
    } else if (arg === '--strip-base-path' || arg === '--strip') {
      config.stripBasePath = args[++i];
    } else if (arg === '--config' || arg === '-c') {
      configPath = args[++i];
    }
  }

  return { userConfig: config, configPath };
}

function printVersion() {
  try {
    const packageJson = require('../package.json');
    console.log(`@build-ts/swagger-codegen v${packageJson.version}`);
  } catch {
    console.log('@build-ts/swagger-codegen (version unknown)');
  }
}

function printHelp() {
  console.log(`
@build-ts/swagger-codegen - Generate TypeScript models from OpenAPI/Swagger specs

Usage: swagger-codegen [swagger-url] [options]

Arguments:
  swagger-url                URL or path to Swagger/OpenAPI specification

Options:
  -o, --output <dir>         Output directory (default: ./src/api)
  -m, --models <dir>         Models subdirectory (default: models)
  -e, --endpoints [dir]      Generate endpoints (optional dir, default: endpoints)
  --strip-base-path <path>   Strip base path from URLs (e.g., /v1/api)
  --strip <path>             Alias for --strip-base-path
  -c, --config <path>        Path to config file
  -v, --version              Show version number
  -h, --help                 Show this help message

Examples:
  # Models only (default)
  swagger-codegen https://api.example.com/docs/json
  
  # Models + Endpoints
  swagger-codegen https://api.example.com/docs/json --endpoints
  
  # Custom directories
  swagger-codegen https://api.example.com/docs/json -o ./src/api --endpoints
  
  # Strip base path
  swagger-codegen https://api.example.com/docs/json --strip /v1/api --endpoints
  
  # Using config file
  swagger-codegen -c ./swagger-codegen.config.js

Config File Example (swagger-codegen.config.js):
  export default {
    swaggerUrl: 'https://api.example.com/docs/json',
    outputDir: './src/api',
    stripBasePath: '/v1/api',
    endpoints: {
      generateEndpoints: true,  // Enable endpoint generation
    },
  };

Generated Structure (Models Only):
  src/api/
  └── models/
      ├── customer.ts       // All customer types
      ├── product.ts        // All product types
      └── index.ts

Generated Structure (Models + Endpoints):
  src/api/
  ├── models/
  │   ├── customer.ts
  │   ├── product.ts
  │   └── index.ts
  └── endpoints/
      ├── customer.ts       // customerEndpoints
      ├── product.ts        // productEndpoints
      └── index.ts

Endpoint Example:
  // endpoints/customer.ts
  export const customerEndpoints = {
    create: () => '/customers',
    getAll: (params?: { page?: number; limit?: number }) => {
      const queryString = params ? '?' + new URLSearchParams(
        Object.entries(params).map(([k, v]) => [k, String(v)])
      ).toString() : '';
      return '/customers' + queryString;
    },
    getById: (id: string | number) => \`/customers/\${id}\`,
    update: (id: string | number) => \`/customers/\${id}\`,
    delete: (id: string | number) => \`/customers/\${id}\`,
  } as const;

Model Example:
  // models/customer.ts
  export interface ICustomerCreateRequest {
    name: string;
    email: string;
  }
  
  export interface ICustomerCreateResponse {
    id: number;
    name: string;
    email: string;
    createdAt: string;
  }
  `);
}

async function main() {
  try {
    const { userConfig, configPath } = parseArgs();

    // Load config file
    const fileConfig = await ConfigLoader.loadConfig(configPath);

    if (!fileConfig && !userConfig.swaggerUrl) {
      Logger.error('No configuration found!');
      Logger.info('Please provide a Swagger URL or create a config file.');
      Logger.info('Run "swagger-codegen --help" for more information.\n');
      process.exit(1);
    }

    // Merge configs (CLI args have highest priority)
    const finalConfig: UserGeneratorConfig = {
      swaggerUrl: userConfig.swaggerUrl || fileConfig?.swaggerUrl || '',
      outputDir: userConfig.outputDir || fileConfig?.outputDir,
      modelsDir: userConfig.modelsDir || fileConfig?.modelsDir,
      endpointsDir: userConfig.endpointsDir || fileConfig?.endpointsDir,
      stripBasePath: userConfig.stripBasePath || fileConfig?.stripBasePath,
      endpoints: {
        generateEndpoints: userConfig.endpoints?.generateEndpoints || fileConfig?.endpoints?.generateEndpoints || false,
        ...fileConfig?.endpoints,
        ...userConfig.endpoints,
      },
    };

    // Validate required swaggerUrl
    if (!finalConfig.swaggerUrl) {
      Logger.error('Swagger URL is required!');
      Logger.info('Provide it via CLI argument or in your config file.\n');
      process.exit(1);
    }

    // Display config
    Logger.info('\n🎯 Configuration:');
    Logger.info(`   Swagger: ${finalConfig.swaggerUrl}`);
    Logger.info(`   Output: ${finalConfig.outputDir || './src/api'}`);
    if (finalConfig.stripBasePath) {
      Logger.info(`   Strip Base Path: ${finalConfig.stripBasePath}`);
    }
    
    const modes: string[] = ['Models'];
    if (finalConfig.endpoints?.generateEndpoints) {
      modes.push('Endpoints');
    }
    Logger.info(`   Mode: ${modes.join(' + ')}\n`);

    // Create generator and run
    const generator = new SwaggerCodeGenerator(finalConfig);
    await generator.generate();

    Logger.success('\n✨ Generation completed successfully!');
    Logger.info(`📁 Models: ${finalConfig.outputDir || './src/api'}/models`);
    if (finalConfig.endpoints?.generateEndpoints) {
      Logger.info(`📁 Endpoints: ${finalConfig.outputDir || './src/api'}/endpoints`);
    }
    Logger.info('');

  } catch (error) {
    Logger.error((error as Error).message);
    if (process.env.DEBUG) {
      console.error(error);
    }
    process.exit(1);
  }
}

main();