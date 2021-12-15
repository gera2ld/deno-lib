import { resolve } from "https://deno.land/std/path/mod.ts";
import { ensureEnvs } from "../env.ts";
import { IStorage } from "../types.ts";

export class LocalFileStorage implements IStorage {
  constructor(public repo: string) {}

  async getFile({ path }: { path: string }) {
    const p = resolve(this.repo, path);
    try {
      const content = await Deno.readTextFile(p);
      return content;
    } catch (err) {
      if (err?.code === "ENOENT") throw { status: 404, data: err };
      throw { status: 500, data: err };
    }
  }

  async putFile(
    { path, source }: { path: string; source: string },
  ) {
    const p = resolve(this.repo, path);
    await Deno.writeFile(p, new TextEncoder().encode(source));
    return { path };
  }

  async updateFile({ path, update }: {
    path: string;
    update: string | ((source: string) => string);
  }) {
    const data = await this.getFile({ path }).catch((err) => {
      if (err?.status === 404) return null;
      throw err;
    });
    const source = typeof update === "string" ? update : update(data || "");
    return this.putFile({ path, source });
  }

  static loadFromEnv() {
    const env = ensureEnvs(["LOCAL_REPO"]);
    return new LocalFileStorage(env.LOCAL_REPO);
  }
}
