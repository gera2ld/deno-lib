/**
 * Note that Deno Deploy does not support fs APIs, please don't import this module
 */
import { ensureFile } from "../deps/deno.ts";
import { Adapter, openDatabase } from "./base.ts";

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

export async function openJSONFile<T>(defaults: T, filename: string) {
  await ensureFile(filename);
  const adapter = new JSONFileAdapter<T>(filename);
  return openDatabase<T>(defaults, adapter);
}
