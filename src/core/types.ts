// src/core/types.ts
export interface SwaggerSpec {
  openapi?: string;
  swagger?: string;
  info: {
    title: string;
    version: string;
  };
  paths: Record<string, Record<string, EndpointDetails>>;
  components?: {
    schemas?: Record<string, SchemaObject>;
  };
  definitions?: Record<string, SchemaObject>;
}

export interface EndpointDetails {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses: Record<string, Response>;
}

export interface SchemaObject {
  type?: string;
  properties?: Record<string, SchemaObject>;
  required?: string[];
  items?: SchemaObject;
  $ref?: string;
  allOf?: SchemaObject[];
  oneOf?: SchemaObject[];
  enum?: string[];
  description?: string;
}

export interface Parameter {
  name: string;
  in: "query" | "path" | "header" | "cookie";
  required?: boolean;
  schema?: SchemaObject;
  description?: string;
}

export interface RequestBody {
  required?: boolean;
  content: Record<string, { schema: SchemaObject }>;
}

export interface Response {
  description: string;
  content?: Record<string, { schema: SchemaObject }>;
}

export interface GeneratedInterface {
  name: string;
  content: string;
  dependencies?: string[];
}

export interface EndpointInfo {
  path: string;
  method: string;
  operationId?: string;
  tag: string;
  summary?: string;
  requestType?: string;
  responseType?: string;
  paramsType?: string;
}

export interface AxiosConfigOptions {
  generateAxiosConfig: boolean;
  axiosConfigPath: string;
  baseUrlPlaceholder: string;
  includeInterceptors: boolean;
  skipDependencyCheck?: boolean;
}

export interface HookOptions {
  generateHooks: boolean;
  hooksDir: string;
  hookPattern: "separate" | "combined";
  includeHeaders: boolean;
  headerPlaceholders?: string[];
  skipDependencyCheck?: boolean;
  useFetch?: boolean;
}

// Main config with nested optionals for CLI
export interface GeneratorConfig {
  swaggerUrl: string;
  outputDir: string;
  modelsDir: string;
  endpointsDir: string;
  generateIndex: boolean;
  axiosConfig: AxiosConfigOptions;
  hooks: HookOptions;
}

// User input type for partial config
export type UserGeneratorConfig = Partial<
  Omit<GeneratorConfig, "axiosConfig" | "hooks">
> & {
  axiosConfig?: Partial<AxiosConfigOptions>;
  hooks?: Partial<HookOptions>;
};
