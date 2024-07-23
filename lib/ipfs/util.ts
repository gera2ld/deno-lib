import { dirname, join, resolve } from 'jsr:@std/path';
import {
  listCar,
  packCar as packCarImpl,
} from 'https://raw.githubusercontent.com/gera2ld/js-lib/dist/deno/ipfs/index.ts';

export { listCar } from 'https://raw.githubusercontent.com/gera2ld/js-lib/dist/deno/ipfs/index.ts';

export interface FileItem {
  name: string;
  path: string;
}

export async function filesFromPaths(paths: string[], base?: string) {
  if (base != null) {
    base = resolve(base);
    if (!base.endsWith('/')) base += '/';
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
      const rootParts = root.split('/');
      const baseParts = base.split('/');
      for (let i = 0; i < baseParts.length; i += 1) {
        if (rootParts[i] !== baseParts[i]) {
          base = baseParts.slice(0, i).join('/') + '/';
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
  return packCarImpl(files);
}

export async function fileToBlob(filepath: string, mimeType: string) {
  const bytes = await Deno.readFile(filepath);
  return new Blob([bytes], { type: mimeType });
}

export async function findCnames(car: Uint8Array) {
  const entries = await listCar(car);
  const pointers = entries.filter((entry) =>
    entry.name === 'CNAME' || entry.name.endsWith('.CNAME')
  );
  const decoder = new TextDecoder();
  const values: { cid: string; cnames: string[] }[] = [];
  pointers.forEach((pointer) => {
    const targetPath = pointer.path.slice(0, -6);
    const target = entries.find((entry) => entry.path === targetPath);
    if (!target) return;
    const cnames = decoder.decode(pointer.node as Uint8Array).split('\n').map(
      (line) => line.trim(),
    ).filter(Boolean);
    values.push({
      cid: target.cid.toString(),
      cnames,
    });
  });
  return values;
}
