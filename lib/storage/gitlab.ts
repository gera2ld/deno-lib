import { ensureEnvs } from "../env.ts";
import { IStorage } from "../types.ts";

const BASE_URL = "https://gitlab.com/api/v4";

export class GitLabStorage implements IStorage {
  constructor(
    private repo: string,
    private accessToken: string,
    private defaultBranch?: string,
  ) {
  }

  private async request<T>({
    url,
    method = "GET",
    type = "json",
    headers = {
      "content-type": "application/json",
    },
  }: {
    url: string;
    method?: string;
    type?: "json" | "text";
    headers?: Record<string, string>;
  }, payload?: unknown): Promise<T> {
    const res = await fetch(BASE_URL + url, {
      method,
      headers: {
        ...headers,
        "private-token": this.accessToken,
      },
      body: method === "GET" ? undefined : JSON.stringify(payload),
    });
    const data = await res[type]();
    if (!res.ok) throw { status: res.status, data };
    return data;
  }

  private async requestFile<T>({
    path,
    branch,
    method = "GET",
    raw = false,
  }: {
    path: string;
    branch: string;
    method?: string;
    raw?: boolean;
  }, payload?: unknown) {
    const url = `/projects/${encodeURIComponent(this.repo)}/repository/files/${
      encodeURIComponent(path)
    }${raw ? "/raw" : ""}?ref=${encodeURIComponent(branch)}`;
    const data = await this.request<T>({ url, method, type: "text" }, payload);
    return data;
  }

  private async getDefaultBranch() {
    if (!this.defaultBranch) {
      const branches = await this.request<
        Array<{ name: string; default: boolean }>
      >({
        url: `/projects/${encodeURIComponent(this.repo)}/repository/branches`,
      });
      this.defaultBranch = branches.find((branch) => branch.default)?.name ||
        "main";
    }
    return this.defaultBranch;
  }

  async getFile(
    { path, branch, silent = false }: {
      path: string;
      branch?: string;
      silent?: boolean;
    },
  ) {
    branch ??= await this.getDefaultBranch();
    try {
      const data = await this.requestFile<string>({ path, branch, raw: true });
      return data;
    } catch (err) {
      if (err?.status === 404 && silent) return;
      throw err;
    }
  }

  async putFile({
    path,
    content,
    branch,
    message = "update",
    isNew = false,
  }: {
    path: string;
    content: string;
    branch?: string;
    message?: string;
    isNew?: boolean;
  }) {
    branch ??= await this.getDefaultBranch();
    const data = await this.request({
      method: isNew ? "POST" : "PUT",
      url: `/projects/${encodeURIComponent(this.repo)}/repository/files/${
        encodeURIComponent(path)
      }`,
    }, {
      branch,
      content,
      commit_message: message,
    });
    return data;
  }

  async updateFile({ path, branch, update }: {
    path: string;
    branch?: string;
    update: string | ((source: string) => string);
  }) {
    branch ??= await this.getDefaultBranch();
    const data = await this.getFile({ path, branch, silent: true });
    const content = typeof update === "string" ? update : update(data || "");
    return this.putFile({ path, content, branch, isNew: data == null });
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
    const env = ensureEnvs(["GITLAB_REPO", "GITLAB_PAT"]);
    return new GitLabStorage(
      env.GITLAB_REPO,
      env.GITLAB_PAT,
      env.GITLAB_BRANCH,
    );
  }
}
