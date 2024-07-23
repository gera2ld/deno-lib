/**
 * Note that Deno Deploy does not support fs APIs, please don't import this module
 */
import { ensureFile } from 'jsr:@std/fs';
import { resolve } from 'jsr:@std/path';
import { ensureEnvs } from '../env.ts';
import { IStorage } from '../types.ts';

export class LocalFileStorage implements IStorage {
  constructor(private repo: string) {}

  async getFile({ path, silent = false }: { path: string; silent?: boolean }) {
    const p = resolve(this.repo, path);
    try {
      const content = await Deno.readTextFile(p);
      return content;
    } catch (err) {
      if (err?.code === 'ENOENT') {
        if (silent) return;
        throw { status: 404, data: err };
      }
      throw { status: 500, data: err };
    }
  }

  async putFile({ path, content }: { path: string; content: string }) {
    const p = resolve(this.repo, path);
    await ensureFile(p);
    await Deno.writeTextFile(p, content);
    return { path };
  }

  async updateFile({ path, update }: {
    path: string;
    update: string | ((source: string) => string);
  }) {
    const content = typeof update === 'string'
      ? update
      : update(await this.getFile({ path, silent: true }) || '');
    return this.putFile({ path, content });
  }

  appendFile({ path, content }: { path: string; content: string }) {
    return this.updateFile({
      path,
      update: (source) => source + content,
    });
  }

  static loadFromEnv() {
    const env = ensureEnvs(['LOCAL_REPO']);
    return new LocalFileStorage(env.LOCAL_REPO);
  }
}
