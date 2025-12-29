import { Logger } from './logger';

export class DependencyChecker {
  static checkPeerDependencies(config: any): void {
    const warnings: string[] = [];

    if (config.hooks?.generateHooks) {
      if (!this.isPackageInstalled('react')) {
        warnings.push('⚠️  react is not installed. Generated hooks will not work.');
      }
      if (!this.isPackageInstalled('axios')) {
        warnings.push('⚠️  axios is not installed. Generated hooks will not work.');
      }
    }

    if (config.axiosConfig?.generateAxiosConfig) {
      if (!this.isPackageInstalled('axios')) {
        warnings.push('⚠️  axios is not installed. Generated axios config will not work.');
      }
    }

    if (warnings.length > 0) {
      Logger.warning('\nMissing peer dependencies:');
      warnings.forEach(w => Logger.warning(w));
      Logger.info('\nInstall with: npm install axios react\n');
    }
  }

  private static isPackageInstalled(packageName: string): boolean {
    try {
      require.resolve(packageName);
      return true;
    } catch {
      return false;
    }
  }
}