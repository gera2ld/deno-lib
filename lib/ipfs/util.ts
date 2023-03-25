import {
  CAREncoderStream,
  createDirectoryEncoderStream,
} from "https://esm.sh/ipfs-car@1.0.0";
import type { Block } from "https://esm.sh/@ipld/unixfs@2.1.1";
import { CarIndexer } from "https://esm.sh/@ipld/car@5.1.1/indexer";
import {
  recursive as exporter,
  UnixFSEntry,
} from "https://esm.sh/ipfs-unixfs-exporter@13.1.0";
import { dirname, join, readAll, resolve } from "../deps/deno.ts";

export interface FileItem {
  name: string;
  path: string;
}

export async function filesFromPaths(paths: string[], base?: string) {
  if (base != null) {
    base = resolve(base);
    if (!base.endsWith("/")) base += "/";
  }
  const fileLists = await Promise.all(paths.map(async (path) => {
    path = resolve(path);
    const entry = await Deno.stat(path);
    let root = path;
    if (!entry.isDirectory) {
      root = dirname(path);
    }
    if (base == null) {
      base = root;
    } else {
      const rootParts = root.split("/");
      const baseParts = base.split("/");
      for (let i = 0; i < baseParts.length; i += 1) {
        if (rootParts[i] !== baseParts[i]) {
          base = baseParts.slice(0, i).join("/") + "/";
          break;
        }
      }
    }
    const files: FileItem[] = [];
    for await (const file of filesFromPath(path)) {
      files.push(file);
    }
    return files;
  }));
  const files = fileLists.flat();
  files.forEach((file) => {
    file.name = file.name.slice(base!.length);
  });
  return files;
}

async function* filesFromPath(path: string) {
  const entry = await Deno.stat(path);
  if (entry.isDirectory) {
    yield* filesFromDir(path);
  } else {
    yield {
      name: path,
      path,
    } as FileItem;
  }
}

async function* filesFromDir(dirname: string): AsyncGenerator<FileItem> {
  for await (const entry of Deno.readDir(dirname)) {
    if (entry.isDirectory) {
      yield* filesFromDir(join(dirname, entry.name));
    } else {
      const path = join(dirname, entry.name);
      yield {
        name: path,
        path,
      } as FileItem;
    }
  }
}

export async function packCar(input: FileItem[]) {
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

export async function listCar(car: Uint8Array) {
  const iterable = await CarIndexer.fromBytes(car);
  const index = new Map<string, { blockLength: number; blockOffset: number }>();
  const order: string[] = [];
  for await (const { cid, blockLength, blockOffset } of iterable) {
    const cidStr = cid.toString();
    index.set(cidStr, { blockLength, blockOffset });
    order.push(cidStr);
  }
  const roots = await iterable.getRoots();
  const entryIterable = exporter(roots[0], {
    get(cid) {
      const { blockOffset, blockLength } = index.get(cid.toString())!;
      return car.slice(blockOffset, blockOffset + blockLength);
    },
  });
  const entries: UnixFSEntry[] = [];
  for await (const entry of entryIterable) {
    entries.push(entry);
  }
  return entries;
}

export async function findCnames(car: Uint8Array) {
  const entries = await listCar(car);
  const pointers = entries.filter((entry) =>
    entry.name === "CNAME" || entry.name.endsWith(".CNAME")
  );
  const decoder = new TextDecoder();
  const values: { cid: string; cnames: string[] }[] = [];
  pointers.forEach((pointer) => {
    const targetPath = pointer.path.slice(0, -6);
    const target = entries.find((entry) => entry.path === targetPath);
    if (!target) return;
    const cnames = decoder.decode(pointer.node as Uint8Array).split("\n").map(
      (line) => line.trim(),
    ).filter(Boolean);
    values.push({
      cid: target.cid.toString(),
      cnames,
    });
  });
  return values;
}
