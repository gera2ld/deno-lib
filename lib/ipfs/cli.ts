import { program } from 'npm:commander';
import { loadEnv } from '../env.ts';
import { filesFromPaths, findCnames, listCar, packCar } from './util.ts';

await loadEnv();
program.name('ipfs-uploader');

program
  .command('packCar <...paths>')
  .option('-o, --output <name>', 'Provide a name for the CAR')
  .action(async (paths: string[], options: { output: string }) => {
    const fileItems = await filesFromPaths(paths);
    const { cid, car } = await packCar(fileItems);
    let name = options.output || cid;
    if (!name.endsWith('.car')) name += '.car';
    car.stream().pipeTo(
      (
        await Deno.open(name, {
          create: true,
          write: true,
          truncate: true,
        })
      ).writable,
    );
    console.info(cid, name);
  });

program.command('listCar <carFile>').action(async (file: string) => {
  const car = await Deno.readFile(file);
  const entries = await listCar(car);
  console.info(entries);
});

program.command('findCnames <carFile>').action(async (file: string) => {
  const car = await Deno.readFile(file);
  const values = await findCnames(car);
  for (const { cid, cnames } of values) {
    for (const cname of cnames) {
      console.info(cname, cid);
    }
  }
});

program.parse();
