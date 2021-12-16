import { ensureFile } from "https://deno.land/std@0.117.0/fs/mod.ts";
import { Adapter, Low } from "https://cdn.skypack.dev/lowdb?dts";
import { debounce } from "https://cdn.skypack.dev/lodash-es";
import { IStorage } from "./types.ts";

export class JSONFileAdapter<T> implements Adapter<T> {
  constructor(private filename: string) {}

  async read(): Promise<T | null> {
    try {
      const data = await Deno.readTextFile(this.filename);
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }

  write(obj: T): Promise<void> {
    return Deno.writeTextFile(this.filename, JSON.stringify(obj, null, 2));
  }
}

export class StorageAdapter<T> implements Adapter<T> {
  constructor(private storage: IStorage, private path: string) {}

  async read(): Promise<T | null> {
    try {
      const data = await this.storage.getFile({ path: this.path });
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }

  write(obj: T): Promise<void> {
    return this.storage.putFile({
      path: this.path,
      source: JSON.stringify(obj, null, 2),
    });
  }
}

export class Database<T> {
  data: T;

  dump: () => void;

  constructor(private db: Low<T>) {
    this.data = db.data!;
    this.dump = debounce(() => this.db.write(), 200);
  }
}

export async function openDatabase<T>(defaults: T, adapter: Adapter<T>) {
  const db = new Low<T>(adapter);
  await db.read();
  db.data = {
    ...defaults,
    ...db.data,
  };
  return new Database<T>(db);
}

export async function openJSONFile<T>(defaults: T, filename: string) {
  await ensureFile(filename);
  const adapter = new JSONFileAdapter<T>(filename);
  return openDatabase<T>(defaults, adapter);
}

export function openStorage<T>(defaults: T, storage: IStorage, path = "db.json") {
  const adapter = new StorageAdapter<T>(storage, path);
  return openDatabase<T>(defaults, adapter);
}
