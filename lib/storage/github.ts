import { decode, encode } from "https://deno.land/std/encoding/base64.ts";
import { ensureEnvs } from "../env.ts";
import { IStorage } from "../types.ts";

export const BASE_URL = "https://api.github.com";

export class GitHubStorage implements IStorage {
  constructor(
    private repo: string,
    private user: string,
    private accessToken: string,
  ) {
  }

  async request({
    method = "GET",
    path,
  }: {
    method?: string;
    path: string;
  }, payload?: any) {
    const res = await fetch(
      `${BASE_URL}/repos/${this.repo}/contents/${path}`,
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

  async getInternalFile(
    { path, branch }: { path: string; branch?: string },
  ): Promise<{
    sha: string;
    source: string;
  }> {
    const data = await this.request({
      path: branch ? `${path}?ref=${branch}` : path,
    });
    if (data.type !== "file") throw data;
    data.source = data.encoding === "base64"
      ? new TextDecoder().decode(decode(data.content))
      : data.content;
    return data;
  }

  async getFile({ path, branch }: { path: string; branch?: string }) {
    const data = await this.getInternalFile({ path, branch });
    return data.source;
  }

  async putFile({
    path,
    sha,
    branch,
    message = "update",
    source,
  }: {
    path: string;
    sha?: string;
    branch?: string;
    message?: string;
    source: string;
  }) {
    const data = await this.request({
      method: "PUT",
      path,
    }, {
      sha,
      message,
      branch,
      content: encode(source),
    });
    return data;
  }

  async updateFile({
    path,
    branch,
    update,
  }: {
    path: string;
    branch?: string;
    update: string | ((source: string) => string);
  }) {
    const data = await this.getInternalFile({ path }).catch((err) => {
      if (err?.status === 404) return { ...err.data, source: "" };
      throw err;
    });
    const source = typeof update === "string" ? update : update(data.source);
    return this.putFile({ path, branch, sha: data.sha, source });
  }

  static loadFromEnv() {
    const env = ensureEnvs(["GITHUB_REPO", "GITHUB_USER", "GITHUB_PAT"]);
    return new GitHubStorage(env.GITHUB_REPO, env.GITHUB_USER, env.GITHUB_PAT);
  }
}
