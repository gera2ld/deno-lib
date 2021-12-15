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
  }): Promise<any>;
  updateFile(
    arg: {
      path: string;
      branch?: string;
      update: string | ((source: string) => string);
    },
  ): Promise<any>;
}

export interface StorageConstructor {
  loadFromEnv(): IStorage;
}
