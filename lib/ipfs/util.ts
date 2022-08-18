import { packToBlob } from "https://esm.sh/ipfs-car@0.8.1/pack/blob";
import { MemoryBlockStore } from "https://esm.sh/ipfs-car@0.8.1/blockstore/memory";
import { join, readAll } from "../deps/deno.ts";

export interface FileItem {
  relpath: string;
  fullpath: string;
}

export async function getFilesFromDir(dirname: string, parent = "") {
  const files: FileItem[] = [];
  for await (const entry of Deno.readDir(dirname)) {
    if (entry.isFile) {
      files.push({
        relpath: join(parent, entry.name),
        fullpath: join(dirname, entry.name),
      });
    } else if (entry.isDirectory) {
      files.push(
        ...await getFilesFromDir(
          join(dirname, entry.name),
          join(parent, entry.name),
        ),
      );
    }
  }
  return files;
}

export async function pack(input: FileItem[]) {
  const { car } = await packToBlob({
    input: await Promise.all(input.map(async ({ relpath, fullpath }) => ({
      path: relpath,
      content: (await Deno.open(fullpath)).readable,
    }))),
    blockstore: new MemoryBlockStore(),
  } as any);
  return car as Blob;
}

export async function fileToBlob(filepath: string, mimeType: string) {
  const f = await Deno.open(filepath);
  const buffer = await readAll(f);
  return new Blob([buffer], { type: mimeType });
}
