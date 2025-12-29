export interface SwaggerSpec {
  openapi?: string;
  swagger?: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  paths: Record<string, Record<string, EndpointDetails>>;
  components?: {
    schemas?: Record<string, SchemaObject>;
    securitySchemes?: Record<string, any>;
  };
  definitions?: Record<string, SchemaObject>;
  tags?: Array<{
    name: string;
    description?: string;
  }>;
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
  format?: string;
  nullable?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
}

export interface Parameter {
  name: string;
  in: "query" | "path" | "header" | "cookie";
  required?: boolean;
  schema?: SchemaObject;
  description?: string;
  type?: string;
  format?: string;
}

export interface RequestBody {
  required?: boolean;
  content: Record<string, { schema: SchemaObject }>;
  description?: string;
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
  originalPath?: string; // Original path before stripping base path
  method: string;
  operationId?: string;
  tag: string;
  summary?: string;
  description?: string;
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
  timeout?: number;
  withCredentials?: boolean;
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

export interface GeneratorConfig {
  swaggerUrl: string;
  outputDir: string;
  modelsDir: string;
  endpointsDir: string;
  generateIndex: boolean;
  stripBasePath?: string | string[];
  axiosConfig: AxiosConfigOptions;
  hooks: HookOptions;
}

export type UserGeneratorConfig = Partial<
  Omit<GeneratorConfig, "axiosConfig" | "hooks">
> & {
  swaggerUrl: string;
  stripBasePath?: string | string[];
  axiosConfig?: Partial<AxiosConfigOptions>;
  hooks?: Partial<HookOptions>;
};

export type ResolvedGeneratorConfig = GeneratorConfig;
