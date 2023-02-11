import { basename } from "../deps/deno.ts";
import { ensureEnv } from "../env.ts";
import { requestJson } from "../http.ts";
import { FileItem, fileToBlob, getFilesFromDir, pack } from "./util.ts";
import { Web3StorageOptions } from "./types.ts";

export async function uploadCar(car: Blob, opts: Web3StorageOptions) {
  const token = opts.token || ensureEnv("WEB3STORAGE_TOKEN");
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  if (opts.name) headers["X-name"] = opts.name;
  const { cid } = await requestJson<{ cid: string }>(
    "https://api.web3.storage/car",
    {
      method: "POST",
      headers,
      body: car,
    },
  );
  return cid;
}

export async function upload(files: FileItem[], opts: Web3StorageOptions) {
  let car: Blob;
  if (opts.isCar) {
    const [file] = files;
    car = await fileToBlob(file.fullpath, "application/vnd.ipld.car");
  } else {
    car = await pack(files);
  }
  return uploadCar(car, opts);
}

export function uploadFiles(files: string[], opts: Web3StorageOptions) {
  const fileItems = files.map((filename) => ({
    relpath: basename(filename),
    fullpath: filename,
  }));
  if (fileItems.length === 1 && fileItems[0].relpath.endsWith(".car")) {
    // Set default values
    opts.isCar ??= true;
    opts.name = (opts.name || fileItems[0].relpath).replace(/\.car$/, "");
  }
  return upload(fileItems, opts);
}

export async function uploadDir(dirname: string, opts: Web3StorageOptions) {
  const files = await getFilesFromDir(dirname);
  return upload(files, opts);
}
