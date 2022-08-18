import { parse } from "../deps/deno.ts";
import { uploadDir, uploadFiles } from "./web3-storage.ts";
import { Web3StorageOptions } from "./types.ts";

async function main() {
  const args = parse(Deno.args);
  const [command, ...rest] = args._.map(String);
  args.name ||= rest[0].replace(/\/$/, "").split("/").pop();
  const opts = args as Web3StorageOptions;
  if (command === "upload") {
    console.info(await uploadFiles(rest, opts));
    return;
  }
  if (command === "uploadDir") {
    console.info(await uploadDir(rest[0], opts));
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
