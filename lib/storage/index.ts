import { GitHubStorage } from "./github.ts";
import { GitHubGistStorage } from "./github-gist.ts";
import { GitLabStorage } from "./gitlab.ts";
import { LocalFileStorage } from "./local.ts";
import type { StorageConstructor } from "../types.ts";

export const storageServices: { [key: string]: StorageConstructor } = {
  github: GitHubStorage,
  githubGist: GitHubGistStorage,
  gitlab: GitLabStorage,
  local: LocalFileStorage,
};

export function loadFromEnv(type: string) {
  return storageServices[type].loadFromEnv();
}
