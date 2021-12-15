import { ensureFile } from "https://deno.land/std@0.117.0/fs/mod.ts";
import { Adapter, Low } from "https://cdn.skypack.dev/lowdb?dts";
import { debounce } from "https://cdn.skypack.dev/lodash-es";

class JSONFile<T> implements Adapter<T> {
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

export class Database<T> {
  data: T;

  dump: () => void;

  constructor(private db: Low<T>) {
    this.data = db.data!;
    this.dump = debounce(() => this.db.write(), 200);
  }

  static async open<T>(filename: string, defaults: T) {
    await ensureFile(filename);
    const adapter = new JSONFile<T>(filename);
    const db = new Low<T>(adapter);
    await db.read();
    db.data = {
      ...defaults,
      ...db.data,
    };
    return new Database<T>(db);
  }
}
