import { ensureEnv } from "../env.ts";
import { requestJson } from "../http.ts";
import { FileItem, getFilesFromDir, pack } from "./util.ts";

export interface Web3StorageOptions {
  name?: string;
}

export async function upload(files: FileItem[], opts?: Web3StorageOptions) {
  const token = ensureEnv("WEB3STORAGE_TOKEN");
  const car = await pack(files);
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  if (opts?.name) headers['X-name'] = opts.name;
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

export async function uploadDir(dirname: string, opts?: Web3StorageOptions) {
  const files = await getFilesFromDir(dirname);
  return upload(files, opts);
}
