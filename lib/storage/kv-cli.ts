#!/usr/bin/env -S deno run -A

import { dirname, join } from 'jsr:@std/path';
import { Command, program } from 'npm:commander';
import { KvDatabase } from './kv.ts';
import { readStdIn, runCommand } from '../cli.ts';
import { ensureEnv } from '../env.ts';

interface GlobalOptions {
  path: string;
}

async function openKv(path: string) {
  const dir = dirname(path);
  await Deno.mkdir(dir, { recursive: true });
  const kv = new KvDatabase(path);
  return kv;
}

program.name('kv');
program.option('--path <path>', 'Set path of database', 'kv.db');

program
  .command('get <key>')
  .description('Show the value of a key')
  .action(async (key: string, _, cmd: Command) => {
    const options = cmd.optsWithGlobals<GlobalOptions>();
    const kv = await openKv(options.path);
    const value = kv.get(key) || '';
    console.log(value);
  });

program
  .command('set <key> [value]')
  .description('Set the value of a key')
  .action(async (key: string, value: string | undefined, _, cmd: Command) => {
    const options = cmd.optsWithGlobals<GlobalOptions>();
    const kv = await openKv(options.path);
    value ??= await readStdIn();
    if (value == null) throw new Error('value is required');
    kv.set(key, value);
  });

program
  .command('del <key>')
  .description('Delete a key')
  .action(async (key: string, _, cmd: Command) => {
    const options = cmd.optsWithGlobals<GlobalOptions>();
    const kv = await openKv(options.path);
    kv.del(key);
  });

program
  .command('keys')
  .description('List all keys')
  .action(async (_, cmd: Command) => {
    const options = cmd.optsWithGlobals<GlobalOptions>();
    const kv = await openKv(options.path);
    console.log(kv.keys().join('\n'));
  });

program
  .command('edit <key>')
  .description('Edit the value of a key with $EDITOR')
  .action(async (key: string, _, cmd: Command) => {
    const options = cmd.optsWithGlobals<GlobalOptions>();
    const kv = await openKv(options.path);
    const value = kv.get(key) || '';
    const temp = await Deno.makeTempFile({
      prefix: key,
    });
    await Deno.writeTextFile(temp, value);
    await runCommand(ensureEnv('EDITOR'), {
      args: [temp],
    }).spawn();
    const newValue = await Deno.readTextFile(temp);
    kv.set(key, newValue);
    await Deno.remove(temp);
  });

program
  .command('import <source>')
  .description('Import data from a directory')
  .action(async (source: string, _, cmd: Command) => {
    const options = cmd.optsWithGlobals<GlobalOptions>();
    const kv = await openKv(options.path);
    for await (const entry of Deno.readDir(source)) {
      const value = await Deno.readTextFile(join(source, entry.name));
      kv.set(entry.name, value);
    }
  });

program
  .command('export')
  .description('Export all data to a directory')
  .option('-o, --outdir <outdir>', 'Output directory', 'kv-data')
  .action(async (_, cmd: Command) => {
    const options = cmd.optsWithGlobals<GlobalOptions & { outdir: string }>();
    await Deno.mkdir(options.outdir, { recursive: true });
    const kv = await openKv(options.path);
    for (const [key, value] of kv.all()) {
      await Deno.writeTextFile(join(options.outdir, key), value);
    }
    console.log(`Data exported to ${options.outdir}`);
  });

program.parse();
