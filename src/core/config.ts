import { GeneratorConfig, UserGeneratorConfig } from './types';
export const DEFAULT_CONFIG: Omit<GeneratorConfig, 'swaggerUrl'> = {
  outputDir: './src/generated',
  modelsDir: 'models',
  endpointsDir: 'endpoints',
  generateIndex: true,
  endpoints: {
    generateEndpoints: false, 
  },
};

export function mergeConfig(userConfig: UserGeneratorConfig): GeneratorConfig {
  if (!userConfig.swaggerUrl) {
    throw new Error('swaggerUrl is required');
  }
  return {
    ...DEFAULT_CONFIG,
    ...userConfig,
    swaggerUrl: userConfig.swaggerUrl,
  };
}