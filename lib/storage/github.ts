import { decodeBase64, encodeBase64 } from 'jsr:@std/encoding/base64';
import { ensureEnvs } from '../env.ts';
import { IStorage } from '../types.ts';

export const BASE_URL = 'https://api.github.com';

export class GitHubStorage implements IStorage {
  constructor(
    private repo: string,
    private user: string,
    private accessToken: string,
  ) {
  }

  private async request<T>({
    method = 'GET',
    path,
  }: {
    method?: string;
    path: string;
  }, payload?: unknown) {
    const res = await fetch(
      `${BASE_URL}/repos/${this.repo}/contents/${path}`,
      {
        method,
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: 'Basic ' +
            encodeBase64(`${this.user}:${this.accessToken}`),
        },
        body: method === 'GET' ? undefined : JSON.stringify(payload),
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
    if (data.type !== 'file') throw data;
    const source = data.encoding === 'base64'
      ? new TextDecoder().decode(decodeBase64(data.content))
      : data.content;
    return { sha: data.sha, source };
  }

  async getFile(
    { path, branch, silent = false }: {
      path: string;
      branch?: string;
      silent?: boolean;
    },
  ) {
    const data = await this.getInternalFile({ path, branch, silent });
    return data?.source;
  }

  async putFile({
    path,
    sha,
    branch,
    message = 'update',
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
      method: 'PUT',
      path,
    }, {
      sha,
      message,
      branch,
      content: encodeBase64(content),
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
    const content = typeof update === 'string'
      ? update
      : update(data?.source || '');
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
    const env = ensureEnvs(['GITHUB_REPO', 'GITHUB_USER', 'GITHUB_PAT']);
    return new GitHubStorage(env.GITHUB_REPO, env.GITHUB_USER, env.GITHUB_PAT);
  }
}
