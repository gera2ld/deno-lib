import { ensureEnvs } from "../env.ts";
import { IStorage, StringMap } from "../types.ts";

const BASE_URL = "https://gitlab.com/api/v4";

export class GitLabStorage implements IStorage {
  constructor(
    public repo: string,
    private accessToken: string,
    private defaultBranch?: string,
  ) {
  }

  async request<T>({
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
    headers?: StringMap;
  }, payload?: any): Promise<T> {
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

  async requestFile<T>({
    path,
    branch,
    method = "GET",
    raw = false,
  }: {
    path: string;
    branch: string;
    method?: string;
    raw?: boolean;
  }, payload?: any) {
    const url = `/projects/${encodeURIComponent(this.repo)}/repository/files/${
      encodeURIComponent(path)
    }${raw ? "/raw" : ""}?ref=${encodeURIComponent(branch)}`;
    const data = await this.request<T>({ url, method, type: "text" }, payload);
    return data;
  }

  async getDefaultBranch() {
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
    { path, branch }: { path: string; branch?: string },
  ) {
    branch ??= await this.getDefaultBranch();
    const data = await this.requestFile<string>({ path, branch, raw: true });
    return data;
  }

  async putFile({
    path,
    source,
    branch,
    message = "update",
    isNew = false,
  }: {
    path: string;
    source: string;
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
      content: source,
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
    const data = await this.getFile({ path, branch }).catch((err) => {
      if (err?.status === 404) return null;
      throw err;
    });
    const source = typeof update === "string" ? update : update(data || "");
    return this.putFile({ path, source, branch, isNew: data == null });
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
