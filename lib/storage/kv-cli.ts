#!/usr/bin/env -S deno run -A

import { dirname, join } from "../deps/deno.ts";
import { cac } from "../deps/cac.ts";
import { KvDatabase } from "./kv.ts";
import { readStdIn, runCommand } from "../cli.ts";
import { ensureEnv } from "../env.ts";

interface GlobalOptions {
  path: string;
}

function showHelpAndThrow() {
  cli.outputHelp();
  Deno.exit(1);
}

async function openKv(path: string) {
  const dir = dirname(path);
  await Deno.mkdir(dir, { recursive: true });
  const kv = new KvDatabase(path);
  return kv;
}

const cli = cac("kv");
cli.option("--path <path>", "Set path of database", {
  default: "kv.db",
});
cli.help();
cli.command("").action(showHelpAndThrow);

// Unknown command
cli.on("command:*", showHelpAndThrow);

cli
  .command("get <key>", "Show the value of a key")
  .action(async (key: string, options: GlobalOptions) => {
    const kv = await openKv(options.path);
    const value = kv.get(key) || "";
    console.log(value);
  });

cli
  .command("set <key> [value]", "Set the value of a key")
  .action(
    async (key: string, value: string | undefined, options: GlobalOptions) => {
      const kv = await openKv(options.path);
      value ??= await readStdIn();
      if (value == null) throw new Error("value is required");
      kv.set(key, value);
    },
  );

cli
  .command("del <key>", "Delete a key")
  .action(async (key: string, options: GlobalOptions) => {
    const kv = await openKv(options.path);
    kv.del(key);
  });

cli.command("keys", "List all keys").action(async (options: GlobalOptions) => {
  const kv = await openKv(options.path);
  console.log(kv.keys().join("\n"));
});

cli
  .command("edit <key>", "Edit the value of a key with $EDITOR")
  .action(async (key: string, options: GlobalOptions) => {
    const kv = await openKv(options.path);
    const value = kv.get(key) || "";
    const temp = await Deno.makeTempFile({
      prefix: key,
    });
    await Deno.writeTextFile(temp, value);
    await runCommand(ensureEnv("EDITOR"), {
      args: [temp],
    });
    const newValue = await Deno.readTextFile(temp);
    kv.set(key, newValue);
    await Deno.remove(temp);
  });

cli
  .command("import <source>", "Import data from a directory")
  .action(async (source: string, options: GlobalOptions) => {
    const kv = await openKv(options.path);
    for await (const entry of Deno.readDir(source)) {
      const value = await Deno.readTextFile(join(source, entry.name));
      kv.set(entry.name, value);
    }
  });

cli
  .command("export", "Export all data to a directory")
  .option("-o, --outdir <outdir>", "Output directory", {
    default: "kv-data",
  })
  .action(async (options: GlobalOptions & { outdir: string }) => {
    await Deno.mkdir(options.outdir, { recursive: true });
    const kv = await openKv(options.path);
    for (const [key, value] of kv.all()) {
      await Deno.writeTextFile(join(options.outdir, key), value);
    }
    console.log(`Data exported to ${options.outdir}`);
  });

cli.parse();
