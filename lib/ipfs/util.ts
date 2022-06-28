import { packToBlob } from "https://esm.sh/ipfs-car@0.7.0/pack/blob?no-check";
import { MemoryBlockStore } from "https://esm.sh/ipfs-car@0.7.0/blockstore/memory?no-check";
import { basename, join } from "../deps.ts";

export interface FileItem {
  path: string;
  content: ReadableStream;
}

export async function createFileItem(
  filepath: string,
  relpath?: string,
): Promise<FileItem> {
  return {
    path: relpath ?? basename(filepath),
    content: (await Deno.open(filepath)).readable,
  };
}

export async function getFilesFromDir(dirname: string) {
  const files: FileItem[] = [];
  for await (const entry of Deno.readDir(dirname)) {
    if (entry.isFile) {
      files.push(await createFileItem(join(dirname, entry.name), entry.name));
    }
  }
  return files;
}

export async function pack(input: FileItem[]) {
  const { car } = await packToBlob({
    input,
    blockstore: new MemoryBlockStore(),
  } as any);
  return car as Blob;
}
