import {
  CAREncoderStream,
  createDirectoryEncoderStream,
} from "https://esm.sh/ipfs-car@1.0.0";
import type { Block } from "https://esm.sh/@ipld/unixfs@2.1.1";
import { join, readAll } from "../deps/deno.ts";

export interface FileItem {
  name: string;
  path: string;
}

export async function getFilesFromDir(dirname: string, parent = "") {
  const files: FileItem[] = [];
  for await (const entry of Deno.readDir(dirname)) {
    if (entry.isFile) {
      files.push({
        name: join(parent, entry.name),
        path: join(dirname, entry.name),
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
  const files = await Promise.all(input.map(async ({ name, path }) => {
    const f = await Deno.open(path);
    return {
      name,
      stream: () => f.readable,
    };
  }));
  const blocks: Block[] = [];
  await createDirectoryEncoderStream(files)
    .pipeTo(
      new WritableStream({
        write(block) {
          blocks.push(block);
        },
      }),
    );
  const rootCID = blocks.at(-1)!.cid;
  const chunks: Uint8Array[] = [];
  await new ReadableStream({
    pull(controller) {
      if (blocks.length) {
        controller.enqueue(blocks.shift());
      } else {
        controller.close();
      }
    },
  })
    .pipeThrough(new CAREncoderStream([rootCID]))
    .pipeTo(
      new WritableStream({
        write(chunk) {
          chunks.push(chunk);
        },
      }),
    );
  const car = new Blob(chunks);
  return { cid: rootCID.toString(), car };
}

export async function fileToBlob(filepath: string, mimeType: string) {
  const f = await Deno.open(filepath);
  const buffer = await readAll(f);
  return new Blob([buffer], { type: mimeType });
}
