import { GitHubStorage } from "./github.ts";
import { GitHubGistStorage } from "./github-gist.ts";
import { GitLabStorage } from "./gitlab.ts";
import type { StorageConstructor } from "../types.ts";

export const storageServices: { [key: string]: StorageConstructor } = {
  github: GitHubStorage,
  githubGist: GitHubGistStorage,
  gitlab: GitLabStorage,
};

export function loadFromEnv(type: string) {
  return storageServices[type].loadFromEnv();
}
