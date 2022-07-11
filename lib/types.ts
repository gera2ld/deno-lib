export interface IStorage {
  getFile(arg: {
    path: string;
    silent?: boolean;
  }): Promise<string | undefined>;
  putFile(arg: {
    path: string;
    content: string;
  }): Promise<unknown>;
  updateFile(
    arg: {
      path: string;
      update: string | ((content: string) => string);
    },
  ): Promise<unknown>;
  appendFile(arg: {
    path: string;
    content: string;
  }): Promise<unknown>;
}

export interface StorageConstructor {
  loadFromEnv(): IStorage;
}
