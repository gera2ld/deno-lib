import { GitHubStorage } from "./github.ts";
import { GitLabStorage } from "./gitlab.ts";
import { LocalFileStorage } from "./local.ts";
import type { StorageConstructor } from "../types.ts";

export const storageServices: { [key: string]: StorageConstructor } = {
  github: GitHubStorage,
  gitlab: GitLabStorage,
  local: LocalFileStorage,
};

export function loadFromEnv(type: string) {
  return storageServices[type].loadFromEnv();
}
