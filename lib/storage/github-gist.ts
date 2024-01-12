import { encodeBase64 } from "../deps/deno.ts";
import { ensureEnvs } from "../env.ts";
import { IStorage } from "../types.ts";
import { BASE_URL } from "./github.ts";

export class GitHubGistStorage implements IStorage {
  constructor(
    private repo: string,
    private user: string,
    private accessToken: string,
  ) {
  }

  private async request({
    method = "GET",
  }: {
    method?: string;
  }, payload?: unknown) {
    const res = await fetch(
      `${BASE_URL}/gists/${this.repo}`,
      {
        method,
        headers: {
          Accept: "application/vnd.github.v3+json",
          Authorization: "Basic " +
            encodeBase64(`${this.user}:${this.accessToken}`),
        },
        body: method === "GET" ? undefined : JSON.stringify(payload),
      },
    );
    const data = await res.json();
    if (!res.ok) throw { status: res.status, data };
    return data;
  }

  private async requestUrl(url: string) {
    const res = await fetch(url);
    return await res.text();
  }

  // private async getFileByAPI({ path }: { path: string }) {
  //   const data = await this.request({});
  //   const file = data.files[path];
  //   if (!file.truncated) {
  //     return file.content;
  //   }
  //   return this.requestUrl(file.raw_url);
  // }

  private getFileByUrl({ path }: { path: string }) {
    const url =
      `https://gist.githubusercontent.com/${this.user}/${this.repo}/raw/${path}`;
    return this.requestUrl(url);
  }

  async getFile({ path, silent = false }: { path: string; silent?: boolean }) {
    try {
      return await this.getFileByUrl({ path });
    } catch (err) {
      if (err?.status === 404 && silent) return;
      throw err;
    }
  }

  putFile({ path, content }: { path: string; content: string }) {
    return this.request({
      method: "PATCH",
    }, {
      files: {
        [path]: {
          content,
        },
      },
    });
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

  appendFile({
    path,
    content,
  }: {
    path: string;
    content: string;
  }) {
    return this.updateFile({
      path,
      update: (source) => source + content,
    });
  }

  static loadFromEnv() {
    const env = ensureEnvs(["GIST_ID", "GIST_OWNER", "GITHUB_PAT"]);
    return new GitHubGistStorage(env.GIST_ID, env.GIST_OWNER, env.GITHUB_PAT);
  }
}
