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

  const config: UserGeneratorConfig = { swaggerUrl: '' };
  let configPath: string | undefined;

  // İlk argument swagger URL ola bilər
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
      config.endpointsDir = args[++i];
    } else if (arg === '--strip-base-path') {
      config.stripBasePath = args[++i];
    } else if (arg === '--hooks') {
      if (!config.hooks) config.hooks = {};
      config.hooks.hooksDir = args[++i];
    } else if (arg === '--no-hooks') {
      if (!config.hooks) config.hooks = {};
      config.hooks.generateHooks = false;
    } else if (arg === '--hook-pattern') {
      if (!config.hooks) config.hooks = {};
      const pattern = args[++i];
      if (pattern === 'separate' || pattern === 'combined') {
        config.hooks.hookPattern = pattern;
      } else {
        Logger.error(`Invalid hook pattern: ${pattern}. Use 'separate' or 'combined'`);
        process.exit(1);
      }
    } else if (arg === '--use-fetch') {
      if (!config.hooks) config.hooks = {};
      config.hooks.useFetch = true;
    } else if (arg === '--no-axios') {
      if (!config.axiosConfig) config.axiosConfig = {};
      config.axiosConfig.generateAxiosConfig = false;
    } else if (arg === '--base-url') {
      if (!config.axiosConfig) config.axiosConfig = {};
      config.axiosConfig.baseUrlPlaceholder = args[++i];
    } else if (arg === '--no-index') {
      config.generateIndex = false;
    } else if (arg === '--config' || arg === '-c') {
      configPath = args[++i];
    }
  }

  return { userConfig: config, configPath };
}

function printVersion() {
  // Read version from package.json
  try {
    const packageJson = require('../package.json');
    console.log(`swagger-codegen v${packageJson.version}`);
  } catch {
    console.log('swagger-codegen (version unknown)');
  }
}

function printHelp() {
  console.log(`
Swagger Code Generator - Generate TypeScript code from OpenAPI/Swagger specs

Usage: swagger-codegen [swagger-url] [options]

Arguments:
  swagger-url           URL or path to Swagger/OpenAPI specification

Options:
  -o, --output <dir>       Output directory (default: ./src/generated)
  -m, --models <dir>       Models subdirectory (default: models)
  -e, --endpoints <dir>    Endpoints subdirectory (default: endpoints)
  --strip-base-path <path> Strip base path from URLs (e.g., /v1/api)
  --hooks <dir>            Hooks subdirectory (default: hooks)
  --no-hooks               Don't generate React hooks
  --hook-pattern <type>    Hook pattern: 'separate' or 'combined' (default: separate)
  --use-fetch              Use native fetch API instead of axios
  --no-axios               Don't generate Axios config
  --base-url <expr>        Base URL placeholder (default: process.env.REACT_APP_API_URL)
  --no-index               Don't generate index files
  -c, --config <path>      Path to config file
  -v, --version            Show version number
  -h, --help               Show this help message

Examples:
  # Basic usage with axios (default)
  swagger-codegen https://api.example.com/swagger.json
  
  # Strip base path
  swagger-codegen https://api.example.com/docs/json --strip-base-path /v1/api
  
  # Using native fetch
  swagger-codegen https://api.example.com/swagger.json --use-fetch
  
  # Fetch + no axios config
  swagger-codegen ./swagger.json --use-fetch --no-axios
  
  # Custom output directory
  swagger-codegen https://api.example.com/swagger.json -o ./src/api
  
  # Using config file
  swagger-codegen -c ./swagger-codegen.config.js
  
  # Vite project with env variable
  swagger-codegen https://api.example.com/swagger.json --base-url "import.meta.env.VITE_API_URL"

Config File Example (swagger-codegen.config.js):
  export default {
    swaggerUrl: 'https://api.example.com/docs/json',
    outputDir: './src/api',
    stripBasePath: '/v1/api',
    axiosConfig: {
      baseUrlPlaceholder: 'import.meta.env.VITE_API_URL',
      includeInterceptors: true,
    },
    hooks: {
      generateHooks: true,
      hookPattern: 'separate',
      useFetch: false,
    },
  };
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
      printHelp();
      process.exit(1);
    }

    // Merge configs (CLI args have highest priority)
    const finalConfig: UserGeneratorConfig = {
      swaggerUrl: userConfig.swaggerUrl || fileConfig?.swaggerUrl || '',
      outputDir: userConfig.outputDir || fileConfig?.outputDir,
      modelsDir: userConfig.modelsDir || fileConfig?.modelsDir,
      endpointsDir: userConfig.endpointsDir || fileConfig?.endpointsDir,
      generateIndex: userConfig.generateIndex ?? fileConfig?.generateIndex,
      stripBasePath: userConfig.stripBasePath || fileConfig?.stripBasePath,
      axiosConfig: {
        ...fileConfig?.axiosConfig,
        ...userConfig.axiosConfig,
      },
      hooks: {
        ...fileConfig?.hooks,
        ...userConfig.hooks,
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
    Logger.info(`   Output: ${finalConfig.outputDir || './src/generated'}`);
    if (finalConfig.stripBasePath) {
      Logger.info(`   Strip Base Path: ${finalConfig.stripBasePath}`);
    }
    if (finalConfig.hooks?.useFetch) {
      Logger.info(`   HTTP Client: fetch (native)`);
    } else {
      Logger.info(`   HTTP Client: axios`);
    }
    Logger.info('');

    // Create generator and run
    const generator = new SwaggerCodeGenerator(finalConfig);
    await generator.generate();

    Logger.info('\n✨ Generation completed successfully!');
    Logger.info(`📁 Output: ${finalConfig.outputDir || './src/generated'}\n`);

  } catch (error) {
    Logger.error((error as Error).message);
    if (process.env.DEBUG) {
      console.error(error);
    }
    process.exit(1);
  }
}

main();