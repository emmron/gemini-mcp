import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger.js';

class Storage {
  constructor(baseDir = '.taskmaster') {
    this.baseDir = baseDir;
    this.files = {
      tasks: path.join(baseDir, 'tasks.json'),
      config: path.join(baseDir, 'config.json'),
      context: path.join(baseDir, 'context.json'),
      cache: path.join(baseDir, 'cache.json')
    };
  }

  async ensureDir() {
    try {
      await fs.mkdir(this.baseDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to create storage directory', { error: error.message });
      throw error;
    }
  }

  async read(filename) {
    try {
      await this.ensureDir();
      const filePath = this.files[filename];
      if (!filePath) throw new Error(`Unknown file: ${filename}`);
      
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return this.getDefaults(filename);
      }
      logger.error('Storage read failed', { filename, error: error.message });
      throw error;
    }
  }

  async write(filename, data) {
    try {
      await this.ensureDir();
      const filePath = this.files[filename];
      if (!filePath) throw new Error(`Unknown file: ${filename}`);
      
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      logger.debug('Storage write completed', { filename });
    } catch (error) {
      logger.error('Storage write failed', { filename, error: error.message });
      throw error;
    }
  }

  getDefaults(filename) {
    const defaults = {
      tasks: { tasks: [], nextId: 1, projectName: path.basename(process.cwd()) },
      config: { projectType: 'general', framework: null, complexity: 'medium', preferences: {} },
      context: { threads: {}, model_performance: {} },
      cache: { research: {}, analysis: {} }
    };
    return defaults[filename] || {};
  }
}

export const storage = new Storage();