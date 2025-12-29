#!/usr/bin/env node

import { SwaggerCodeGenerator } from './core/generator';
import { mergeConfig } from './core/config';
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

  const config: UserGeneratorConfig = {};
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
    } else if (arg === '--hooks') {
      if (!config.hooks) config.hooks = {};
      config.hooks.hooksDir = args[++i];
    } else if (arg === '--no-hooks') {
      if (!config.hooks) config.hooks = {};
      config.hooks.generateHooks = false;
    } else if (arg === '--use-fetch') { // YENİ OPTION
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

function printHelp() {
  console.log(`
Swagger Code Generator - Generate TypeScript code from OpenAPI/Swagger specs

Usage: swagger-codegen [swagger-url] [options]

Arguments:
  swagger-url           URL or path to Swagger/OpenAPI specification

Options:
  -o, --output <dir>    Output directory (default: ./src/generated)
  -m, --models <dir>    Models subdirectory (default: models)
  -e, --endpoints <dir> Endpoints subdirectory (default: endpoints)
  --hooks <dir>         Hooks subdirectory (default: hooks)
  --no-hooks            Don't generate React hooks
  --use-fetch           Use native fetch API instead of axios
  --no-axios            Don't generate Axios config
  --base-url <expr>     Base URL placeholder (default: process.env.REACT_APP_API_URL)
  --no-index            Don't generate index files
  -c, --config <path>   Path to config file
  -h, --help            Show this help message

Examples:
  # Using axios (default)
  swagger-codegen https://api.example.com/swagger.json
  
  # Using native fetch
  swagger-codegen https://api.example.com/swagger.json --use-fetch
  
  # Fetch + no axios config
  swagger-codegen ./swagger.json --use-fetch --no-axios
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
      ...fileConfig,
      ...userConfig,
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

    // Merge with defaults and generate
    const config = mergeConfig(finalConfig);

    Logger.info('\n🎯 Configuration:');
    Logger.info(`   Swagger: ${config.swaggerUrl}`);
    Logger.info(`   Output: ${config.outputDir}\n`);

    const generator = new SwaggerCodeGenerator(config);
    await generator.generate();
  } catch (error) {
    Logger.error((error as Error).message);
    process.exit(1);
  }
}

main();