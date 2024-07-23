import { IStorage } from '../types.ts';
import { Adapter, openDatabase } from './base.ts';

export class StorageAdapter<T> implements Adapter<T> {
  constructor(private storage: IStorage, private path: string) {}

  async read(): Promise<T | null> {
    try {
      const data = await this.storage.getFile({ path: this.path });
      return JSON.parse(data || '') as T;
    } catch {
      return null;
    }
  }

  async write(obj: T): Promise<void> {
    await this.storage.putFile({
      path: this.path,
      content: JSON.stringify(obj, null, 2),
    });
  }
}

export function openStorage<T>(
  defaults: T,
  storage: IStorage,
  path: string,
) {
  const adapter = new StorageAdapter<T>(storage, path);
  return openDatabase<T>(defaults, adapter);
}
