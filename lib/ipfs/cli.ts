import { cac } from "../deps/cac.ts";
import { loadEnv } from "../env.ts";
import { uploadCarFile, uploadFiles } from "./web3-storage.ts";
import { Web3StorageOptions } from "./types.ts";
import { filesFromPaths, findCnames, listCar, packCar } from "./util.ts";

await loadEnv();
const cli = cac("ipfs-uploader");

cli.command("upload <...paths>")
  .option("--name <name>", "Provide a name for the CAR")
  .action(async (paths: string[], options: Web3StorageOptions) => {
    options.name ||= paths[0].split("/").pop();
    console.info(await uploadFiles(paths, options));
  });

cli.command("uploadCar <carFile>")
  .option("--name <name>", "Provide a name for the CAR")
  .action(async (file: string, options: Web3StorageOptions) => {
    console.info(await uploadCarFile(file, options));
  });

cli.command("packCar <...paths>")
  .option("-o, --output <name>", "Provide a name for the CAR")
  .action(async (paths: string[], options: { output: string }) => {
    const fileItems = await filesFromPaths(paths);
    const { cid, car } = await packCar(fileItems);
    let name = options.output || cid;
    if (!name.endsWith(".car")) name += ".car";
    car.stream().pipeTo(
      (await Deno.open(name, {
        create: true,
        write: true,
        truncate: true,
      })).writable,
    );
    console.info(cid, name);
  });

cli.command("listCar <carFile>")
  .action(async (file: string) => {
    const car = await Deno.readFile(file);
    const entries = await listCar(car);
    console.info(entries);
  });

cli.command("findCnames <carFile>")
  .action(async (file: string) => {
    const car = await Deno.readFile(file);
    const values = await findCnames(car);
    for (const { cid, cnames } of values) {
      for (const cname of cnames) {
        console.info(cname, cid);
      }
    }
  });

cli.help();
cli.parse();
