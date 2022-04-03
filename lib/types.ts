export interface StringMap {
  [key: string]: string;
}

export interface IStorage {
  getFile(arg: {
    path: string;
    branch?: string;
  }): Promise<string>;
  putFile(arg: {
    path: string;
    sha?: string;
    branch?: string;
    message?: string;
    source: string;
  }): Promise<unknown>;
  updateFile(
    arg: {
      path: string;
      branch?: string;
      update: string | ((source: string) => string);
    },
  ): Promise<unknown>;
}

export interface StorageConstructor {
  loadFromEnv(): IStorage;
}
