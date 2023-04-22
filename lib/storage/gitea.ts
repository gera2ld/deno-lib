import { base64 } from "../deps/deno.ts";
import { ensureEnvs } from "../env.ts";
import { IStorage } from "../types.ts";

export class GiteaStorage implements IStorage {
  constructor(
    private repo: string,
    private accessToken: string,
    private baseUrl: string,
  ) {}

  private async request<T>({
    method = "GET",
    path,
  }: {
    method?: string;
    path: string;
  }, payload?: unknown) {
    const res = await fetch(
      `${this.baseUrl}/repos/${this.repo}/contents/${path}`,
      {
        method,
        headers: {
          Accept: "application/json",
          Authorization: `token ${this.accessToken}`,
          "Content-type": "application/json",
        },
        body: method === "GET" ? undefined : JSON.stringify(payload),
      },
    );
    const data = await res.json() as T;
    if (!res.ok) throw { status: res.status, data };
    return data;
  }

  private async getInternalFile(
    { path, branch, silent = false }: {
      path: string;
      branch?: string;
      silent?: boolean;
    },
  ) {
    let data: {
      type: string;
      encoding: string;
      content: string;
      sha: string;
    };
    try {
      data = await this.request({
        path: branch ? `${path}?ref=${branch}` : path,
      });
    } catch (err) {
      if (err?.status === 404 && silent) return;
      throw err;
    }
    if (data.type !== "file") throw data;
    const source = data.encoding === "base64"
      ? new TextDecoder().decode(base64.decode(data.content))
      : data.content;
    return { sha: data.sha, source };
  }

  async getFile({
    path,
    branch,
    silent = false,
  }: {
    path: string;
    branch?: string;
    silent?: boolean;
  }) {
    const data = await this.getInternalFile({ path, branch, silent });
    return data?.source;
  }

  async putFile({
    path,
    sha,
    branch,
    message = "update",
    content,
  }: {
    path: string;
    /** Required for update an existing file */
    sha?: string;
    branch?: string;
    message?: string;
    content: string;
  }) {
    const data = await this.request({
      method: sha ? "PUT" : "POST",
      path,
    }, {
      sha,
      message,
      branch,
      content: base64.encode(content),
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
    const data = await this.getInternalFile({ path, silent: true });
    const content = typeof update === "string"
      ? update
      : update(data?.source || "");
    return this.putFile({ path, branch, sha: data?.sha, content });
  }

  appendFile({
    path,
    branch,
    content,
  }: {
    path: string;
    branch?: string;
    content: string;
  }) {
    return this.updateFile({
      path,
      branch,
      update: (source) => source + content,
    });
  }

  static loadFromEnv() {
    const env = ensureEnvs(["GITEA_REPO", "GITEA_TOKEN", "GITEA_URL"]);
    return new GiteaStorage(env.GITEA_REPO, env.GITEA_TOKEN, env.GITEA_URL);
  }
}
