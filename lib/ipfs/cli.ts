import { parse } from "../deps/deno.ts";
import { uploadDir, uploadFiles } from "./web3-storage.ts";
import { Web3StorageOptions } from "./types.ts";

async function main() {
  const args = parse(Deno.args);
  const [command, ...rest] = args._.map(String);
  if (command === "upload") {
    console.info(await uploadFiles(rest, args as Web3StorageOptions));
    return;
  }
  if (command === "uploadDir") {
    console.info(await uploadDir(rest[0], args as Web3StorageOptions));
    return;
  }
  if (command) {
    throw new Error(`Unknown command: ${command}`);
  }
}

main().catch((err) => {
  console.error(err);
  Deno.exit(1);
});
