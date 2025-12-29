import { GeneratorConfig } from './types';
import { SwaggerParser } from '../parsers/swagger-parser';
import { EndpointParser } from '../parsers/endpoint-parser';
import { ModelGenerator } from '../generators/model-generator';
import { EndpointGenerator } from '../generators/endpoint-generator';
import { IndexGenerator } from '../generators/index-generator';
import { AxiosConfigGenerator } from '../generators/axios-config-generator';
import { HooksGenerator } from '../generators/hooks-generator';
import { Logger } from '../utils/logger';
import path from 'path';
import { DependencyChecker } from '../utils/dependency-checker';

export class SwaggerCodeGenerator {
  private config: GeneratorConfig;

  constructor(config: GeneratorConfig) {
    this.config = config;
  }

  async generate() {
    Logger.info('🚀 Starting code generation...\n');

    try {
      if (!this.config.hooks?.skipDependencyCheck && 
          !this.config.axiosConfig?.skipDependencyCheck) {
        DependencyChecker.checkPeerDependencies(this.config);
      }

      // Parse swagger
      const parser = new SwaggerParser();
      const spec = await parser.parse(this.config.swaggerUrl);

      // Parse endpoints
      const endpointParser = new EndpointParser();
      const endpointsByTag = endpointParser.parse(spec);

      Logger.info(`\nFound ${endpointsByTag.size} tags with endpoints\n`);

      const modelsPath = path.join(this.config.outputDir, this.config.modelsDir);
      const endpointsPath = path.join(this.config.outputDir, this.config.endpointsDir);

      // Generate models
      const modelGenerator = new ModelGenerator(modelsPath);
      modelGenerator.generate(spec, endpointsByTag);

      // Generate endpoints
      const endpointGenerator = new EndpointGenerator(endpointsPath);
      endpointGenerator.generate(endpointsByTag);

      // Generate axios config (artıq optional check lazım deyil)
      if (this.config.axiosConfig.generateAxiosConfig) {
        const configPath = path.join(
          this.config.outputDir, 
          this.config.axiosConfig.axiosConfigPath
        );
        const axiosConfigGen = new AxiosConfigGenerator(configPath, this.config.axiosConfig);
        axiosConfigGen.generate();
      }

      // Generate hooks (artıq optional check lazım deyil)
      if (this.config.hooks.generateHooks) {
        const hooksPath = path.join(
          this.config.outputDir,
          this.config.hooks.hooksDir
        );
        const hooksGen = new HooksGenerator(hooksPath, this.config.hooks);
        hooksGen.generate(endpointsByTag);
      }

      // Generate index files
      if (this.config.generateIndex) {
        const tags = Array.from(endpointsByTag.keys());
        
        const modelIndexGen = new IndexGenerator(modelsPath);
        modelIndexGen.generateModelIndex(tags);

        const endpointIndexGen = new IndexGenerator(endpointsPath);
        endpointIndexGen.generateEndpointIndex(tags);
      }

      Logger.success('\n🎉 Code generation completed successfully!\n');
      this.printSummary(endpointsByTag);
    } catch (error) {
      Logger.error(`Generation failed: ${(error as Error).message}`);
      throw error;
    }
  }

  private printSummary(endpointsByTag: Map<string, any[]>) {
    console.log('📊 Summary:');
    console.log(`   Output directory: ${this.config.outputDir}`);
    console.log(`   Models: ${path.join(this.config.outputDir, this.config.modelsDir)}`);
    console.log(`   Endpoints: ${path.join(this.config.outputDir, this.config.endpointsDir)}`);
    
    if (this.config.axiosConfig.generateAxiosConfig) {
      console.log(`   Axios config: ${path.join(this.config.outputDir, this.config.axiosConfig.axiosConfigPath)}`);
    }
    
    if (this.config.hooks.generateHooks) {
      console.log(`   Hooks: ${path.join(this.config.outputDir, this.config.hooks.hooksDir)}`);
    }
    
    console.log(`   Total tags: ${endpointsByTag.size}`);
    console.log(`   Total endpoints: ${Array.from(endpointsByTag.values()).flat().length}`);
  }
}