import { debounce } from "../deps/lodash.ts";

export interface Adapter<T> {
  read(): Promise<T | null>;
  write(data: T): Promise<void>;
}

export class Database<T> {
  data: T;

  constructor(private defaults: T, private adapter: Adapter<T>) {
    this.data = { ...defaults };
  }

  dump = debounce(() => {
    this.dumpOnce().catch((err) => {
      console.error(err);
    });
  }, 200);

  dumpOnce() {
    return this.adapter.write(this.data);
  }

  async read() {
    this.data = {
      ...this.defaults,
      ...(await this.adapter.read()),
    };
  }
}

export async function openDatabase<T>(defaults: T, adapter: Adapter<T>) {
  const db = new Database<T>(defaults, adapter);
  await db.read();
  return db;
}
