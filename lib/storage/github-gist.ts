import { encode } from "../deps/encoding.ts";
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

  async request({
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
            encode(`${this.user}:${this.accessToken}`),
        },
        body: method === "GET" ? undefined : JSON.stringify(payload),
      },
    );
    const data = await res.json();
    if (!res.ok) throw { status: res.status, data };
    return data;
  }

  async requestUrl(url: string) {
    const res = await fetch(url);
    return await res.text();
  }

  async getFileByAPI({ path }: { path: string }) {
    const data = await this.request({});
    const file = data.files[path];
    if (!file.truncated) {
      return file.content;
    }
    return this.requestUrl(file.raw_url);
  }

  getFileByUrl({ path }: { path: string }) {
    const url =
      `https://gist.githubusercontent.com/${this.user}/${this.repo}/raw/${path}`;
    return this.requestUrl(url);
  }

  getFile({ path }: { path: string }) {
    return this.getFileByUrl({ path });
  }

  putFile({ path, source }: { path: string; source: string }) {
    return this.request({
      method: "PATCH",
    }, {
      files: {
        [path]: {
          content: source,
        },
      },
    });
  }

  async updateFile({ path, update }: {
    path: string;
    update: string | ((source: string) => string);
  }) {
    const data = await this.getFile({ path });
    const source = typeof update === "string" ? update : update(data);
    return this.putFile({ path, source });
  }

  static loadFromEnv() {
    const env = ensureEnvs(["GIST_ID", "GIST_OWNER", "GITHUB_PAT"]);
    return new GitHubGistStorage(env.GIST_ID, env.GIST_OWNER, env.GITHUB_PAT);
  }
}
