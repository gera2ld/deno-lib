import { ensureEnvs } from "../env.ts";
import { IStorage } from "../types.ts";

export class APIStorage implements IStorage {
  constructor(private endpoint: string, private token: string) {}

  private async request<T>({
    url,
    method = "GET",
    type = "json",
  }: {
    url: string;
    method?: string;
    type?: "json" | "text";
  }, payload?: string) {
    const res = await fetch(this.endpoint + url, {
      method,
      headers: {
        "Authorization": `Bearer ${this.token}`,
      },
      body: payload,
    });
    const data = await res[type]() as T;
    if (!res.ok) throw { status: res.status, data };
    return data;
  }

  async getFile({ path, silent = false }: { path: string; silent?: boolean }) {
    try {
      return await this.request<string>({
        url: path,
        type: "text",
      });
    } catch (err) {
      if (err?.status === 404 && silent) return;
      throw err;
    }
  }

  putFile(
    { path, content }: { path: string; content: string },
  ) {
    return this.request({
      method: "PUT",
      url: path,
    }, content);
  }

  async updateFile({ path, update }: {
    path: string;
    update: string | ((source: string) => string);
  }) {
    const content = typeof update === "string"
      ? update
      : update(await this.getFile({ path, silent: true }) || "");
    return this.putFile({ path, content });
  }

  appendFile({ path, content }: { path: string; content: string }) {
    return this.updateFile({
      path,
      update: (source) => source + content,
    });
  }

  static loadFromEnv() {
    const env = ensureEnvs([
      "STORAGE_API_ENDPOINT",
      "STORAGE_API_TOKEN",
    ]);
    return new APIStorage(env.STORAGE_API_ENDPOINT, env.STORAGE_API_TOKEN);
  }
}
