import fs from 'fs';
import path from 'path';
import { Logger } from '../utils/logger';

export class FileWriter {
  private baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
    this.ensureDirectoryExists(baseDir);
  }

  ensureDirectoryExists(dir: string) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      Logger.created(`Directory: ${dir}`);
    }
  }

  writeFile(relativePath: string, content: string, append: boolean = false) {
    const fullPath = path.join(this.baseDir, relativePath);
    const dir = path.dirname(fullPath);

    this.ensureDirectoryExists(dir);

    if (append && fs.existsSync(fullPath)) {
      const existingContent = fs.readFileSync(fullPath, 'utf-8');
      
      // Duplicate check
      const newContent = this.removeDuplicates(existingContent, content);
      
      if (newContent === existingContent) {
        Logger.skipped(`${relativePath} (no changes)`);
        return;
      }

      fs.writeFileSync(fullPath, newContent, 'utf-8');
      Logger.updated(`${relativePath}`);
    } else {
      fs.writeFileSync(fullPath, content, 'utf-8');
      Logger.created(`${relativePath}`);
    }
  }

  private removeDuplicates(existing: string, newContent: string): string {
    const existingInterfaces = this.extractInterfaceNames(existing);
    const newInterfaces = this.extractInterfaceNames(newContent);

    const uniqueNew = newContent
      .split('\n')
      .filter(line => {
        const match = line.match(/export interface (\w+)/);
        if (match) {
          return !existingInterfaces.has(match[1]);
        }
        return true;
      })
      .join('\n');

    if (uniqueNew.trim()) {
      return existing + '\n' + uniqueNew;
    }

    return existing;
  }

  private extractInterfaceNames(content: string): Set<string> {
    const names = new Set<string>();
    const regex = /export interface (\w+)/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      names.add(match[1]);
    }

    return names;
  }
}