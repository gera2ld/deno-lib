import { cac } from "../deps/cac.ts";
import { uploadDir, uploadFiles } from "./web3-storage.ts";
import { Web3StorageOptions } from "./types.ts";

const cli = cac("ipfs-uploader");

cli.command("upload [...files]")
  .option("--name <name>", "Provide a name for the CAR")
  .option("--isCar", "Upload the only file as a CAR")
  .action(async (files: string[], options: Web3StorageOptions) => {
    options.name ||= files[0].split("/").pop();
    console.info(await uploadFiles(files, options));
  });

cli.command("uploadDir <dir>")
  .option("--name <name>", "Provide a name for the CAR")
  .action(async (dir: string, options: Web3StorageOptions) => {
    options.name ||= dir.replace(/\/$/, "").split("/").pop();
    console.info(await uploadDir(dir, options));
  });

cli.help();
cli.parse();
