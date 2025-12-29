import { SwaggerParser } from "../parsers/swagger-parser";
import { EndpointParser } from "../parsers/endpoint-parser";
import { ModelGenerator } from "../generators/model-generator";
import { EndpointGenerator } from "../generators/endpoint-generator";
import { AxiosConfigGenerator } from "../generators/axios-config-generator";
import { HooksGenerator } from "../generators/hooks-generator";
import { IndexGenerator } from "../generators/index-generator";
import { UserGeneratorConfig, ResolvedGeneratorConfig } from "./types";
import { Logger } from "../utils/logger";
import path from "path";
import fs from "fs";

export class SwaggerCodeGenerator {
  private config: ResolvedGeneratorConfig;

  constructor(userConfig: UserGeneratorConfig) {
    this.config = this.resolveConfig(userConfig);
  }

  async generate() {
    try {
      Logger.info("🚀 Starting code generation...");

      // Parse Swagger
      Logger.step("Parsing Swagger specification...");
      const swaggerParser = new SwaggerParser();
      const spec = await swaggerParser.parse(this.config.swaggerUrl);
      Logger.success("Swagger parsed successfully");

      // Parse endpoints
      const endpointParser = new EndpointParser();
      const endpointsByTag = endpointParser.parse(spec, this.config);

      // Create output directories
      this.createDirectories();

      // Generate models
      const modelGenerator = new ModelGenerator(
        path.join(this.config.outputDir, this.config.modelsDir)
      );
      modelGenerator.generate(spec, endpointsByTag, this.config);

      // Generate endpoints (pass spec!)
      const endpointGenerator = new EndpointGenerator(
        path.join(this.config.outputDir, this.config.endpointsDir)
      );
      endpointGenerator.generate(endpointsByTag, this.config, spec);

      // Generate axios config
      if (this.config.axiosConfig.generateAxiosConfig) {
        const axiosGenerator = new AxiosConfigGenerator(
          path.join(
            this.config.outputDir,
            this.config.axiosConfig.axiosConfigPath
          )
        );
        axiosGenerator.generate(this.config);
      }

      // Generate React hooks
      if (this.config.hooks.generateHooks) {
        const hooksGenerator = new HooksGenerator(
          path.join(this.config.outputDir, this.config.hooks.hooksDir)
        );
        hooksGenerator.generate(endpointsByTag, this.config);
      }

      // Generate index files
      if (this.config.generateIndex) {
        const indexGenerator = new IndexGenerator(this.config.outputDir);
        indexGenerator.generate(endpointsByTag, this.config);
      }

      Logger.success("✅ Code generation completed successfully!");
      Logger.info(`📁 Output directory: ${this.config.outputDir}`);
    } catch (error: any) {
      Logger.error(`Generation failed: ${error.message}`);
      throw error;
    }
  }

  private createDirectories() {
    const dirs = [
      this.config.outputDir,
      path.join(this.config.outputDir, this.config.modelsDir),
      path.join(this.config.outputDir, this.config.endpointsDir),
    ];

    if (this.config.axiosConfig.generateAxiosConfig) {
      dirs.push(
        path.join(
          this.config.outputDir,
          this.config.axiosConfig.axiosConfigPath
        )
      );
    }

    if (this.config.hooks.generateHooks) {
      dirs.push(path.join(this.config.outputDir, this.config.hooks.hooksDir));
    }

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  private resolveConfig(
    userConfig: UserGeneratorConfig
  ): ResolvedGeneratorConfig {
    return {
      swaggerUrl: userConfig.swaggerUrl,
      outputDir: userConfig.outputDir || "./src/generated",
      modelsDir: userConfig.modelsDir || "models",
      endpointsDir: userConfig.endpointsDir || "endpoints",
      generateIndex: userConfig.generateIndex !== false,
      stripBasePath: userConfig.stripBasePath,

      axiosConfig: {
        generateAxiosConfig:
          userConfig.axiosConfig?.generateAxiosConfig !== false,
        axiosConfigPath: userConfig.axiosConfig?.axiosConfigPath || "config",
        baseUrlPlaceholder:
          userConfig.axiosConfig?.baseUrlPlaceholder ||
          "process.env.REACT_APP_API_URL",
        includeInterceptors:
          userConfig.axiosConfig?.includeInterceptors !== false,
      },

      hooks: {
        generateHooks: userConfig.hooks?.generateHooks !== false,
        hooksDir: userConfig.hooks?.hooksDir || "hooks",
        hookPattern: userConfig.hooks?.hookPattern || "separate",
        useFetch: userConfig.hooks?.useFetch || false,
        includeHeaders: userConfig.hooks?.includeHeaders !== false,
        headerPlaceholders: userConfig.hooks?.headerPlaceholders || [],
      },
    };
  }
}
