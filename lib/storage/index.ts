import { GitHubStorage } from "./github.ts";
import { GitHubGistStorage } from "./github-gist.ts";
import { GitLabStorage } from "./gitlab.ts";
import { APIStorage } from "./api.ts";
import type { StorageConstructor } from "../types.ts";

const gitServices = {
  github: GitHubStorage,
  githubGist: GitHubGistStorage,
  gitlab: GitLabStorage,
  api: APIStorage,
};

type StorageServices = typeof gitServices & {
  [key: string]: StorageConstructor;
};

export const storageServices: StorageServices = {
  ...gitServices,
};

export function loadFromEnv(type: string) {
  return storageServices[type].loadFromEnv();
}
