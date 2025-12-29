import { GeneratorConfig, AxiosConfigOptions, HookOptions, UserGeneratorConfig } from './types';

const DEFAULT_AXIOS_CONFIG: AxiosConfigOptions = {
  generateAxiosConfig: true,
  axiosConfigPath: 'config',
  baseUrlPlaceholder: 'process.env.REACT_APP_API_URL',
  includeInterceptors: true,
};

const DEFAULT_HOOK_OPTIONS: HookOptions = {
  generateHooks: true,
  hooksDir: 'hooks',
  hookPattern: 'separate',
  includeHeaders: true,
  headerPlaceholders: ['userId', 'token'],
  useFetch: false,
};

export const DEFAULT_CONFIG: Omit<GeneratorConfig, 'swaggerUrl'> = {
  outputDir: './src/generated',
  modelsDir: 'models',
  endpointsDir: 'endpoints',
  generateIndex: true,
  axiosConfig: DEFAULT_AXIOS_CONFIG,
  hooks: DEFAULT_HOOK_OPTIONS,
};

export function mergeConfig(userConfig: UserGeneratorConfig): GeneratorConfig {
  if (!userConfig.swaggerUrl) {
    throw new Error('swaggerUrl is required');
  }

  // Deep merge for nested objects
  const axiosConfig: AxiosConfigOptions = {
    ...DEFAULT_AXIOS_CONFIG,
    ...(userConfig.axiosConfig || {}),
  };

  const hooks: HookOptions = {
    ...DEFAULT_HOOK_OPTIONS,
    ...(userConfig.hooks || {}),
  };

  return {
    ...DEFAULT_CONFIG,
    ...userConfig,
    swaggerUrl: userConfig.swaggerUrl,
    axiosConfig,
    hooks,
  };
}