import { basename } from "../deps/deno.ts";
import { ensureEnv } from "../env.ts";
import { requestJson } from "../http/util.ts";
import { filesFromPaths, fileToBlob, packCar } from "./util.ts";
import { Web3StorageOptions } from "./types.ts";

export async function uploadAsCar(car: Blob, opts: Web3StorageOptions) {
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

export async function uploadCarFile(file: string, opts: Web3StorageOptions) {
  const car = await fileToBlob(file, "application/vnd.ipld.car");
  opts = {
    ...opts,
  };
  opts.name ||= basename(file).replace(/\.car$/, "");
  return uploadAsCar(car, opts);
}

export async function uploadFiles(paths: string[], opts: Web3StorageOptions) {
  const fileItems = await filesFromPaths(paths);
  const { car } = await packCar(fileItems);
  return uploadAsCar(car, opts);
}
