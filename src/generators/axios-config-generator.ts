// src/generators/axios-config-generator.ts
import { AxiosConfigOptions } from '../core/types';
import { FileWriter } from '../writers/file-writer';
import { Logger } from '../utils/logger';

export class AxiosConfigGenerator {
  private fileWriter: FileWriter;
  private options: AxiosConfigOptions;

  constructor(outputDir: string, options: AxiosConfigOptions) {
    this.fileWriter = new FileWriter(outputDir);
    this.options = options;
  }

  generate() {
    if (!this.options.generateAxiosConfig) {
      return;
    }

    Logger.step('Generating Axios config...');

    const configContent = this.generateConfigFile();
    this.fileWriter.writeFile('axiosInstance.ts', configContent);

    // Types file
    const typesContent = this.generateTypesFile();
    this.fileWriter.writeFile('types.ts', typesContent);

    Logger.success('Axios config generated');
  }

  private generateConfigFile(): string {
    return `import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ApiError } from './types';

const BASE_URL = ${this.options.baseUrlPlaceholder} || 'http://localhost:3000';

// Create axios instance
export const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

${this.options.includeInterceptors ? this.generateInterceptors() : ''}

export default axiosInstance;
`;
  }

  private generateInterceptors(): string {
    return `
// Request interceptor
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Buraya token, userId və s. əlavə edə bilərsiniz
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = \`Bearer \${token}\`;
    // }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  (error) => {
    const apiError: ApiError = {
      message: error.response?.data?.message || error.message || 'An error occurred',
      status: error.response?.status,
      data: error.response?.data,
    };
    
    // Global error handling
    if (error.response?.status === 401) {
      // Handle unauthorized
      console.error('Unauthorized access');
    }
    
    return Promise.reject(apiError);
  }
);
`;
  }

  private generateTypesFile(): string {
    return `export interface ApiError {
  message: string;
  status?: number;
  data?: any;
}

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success?: boolean;
}
`;
  }
}