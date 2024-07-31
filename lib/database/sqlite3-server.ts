/**
 * Usage:
 *
 * $ deno run -A https://raw.githubusercontent.com/gera2ld/deno-lib/main/lib/database/sqlite.ts path/to/db.sqlite
 */

import { Database, type DatabaseOpenOptions } from 'jsr:@db/sqlite@0.11';
import { parseArgs } from 'jsr:@std/cli';

const args = parseArgs(Deno.args);
const listenOptions: Deno.ServeOptions = {
  hostname: args.hostname || '[::]',
  port: +args.port || 3601,
};
const dbOptions: DatabaseOpenOptions = {};
if (args.readonly) dbOptions.readonly = true;
const file = args._[0] as string;

async function handleRequest(request: Request) {
  const query = await request.json();
  try {
    const db = new Database(file, dbOptions);
    const rows = db.prepare(query.sql).values(query.params);
    db.close();
    return new Response(JSON.stringify({ result: rows }), {
      headers: { 'content-type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: `${err}` }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}

const server = Deno.serve(listenOptions, handleRequest);
console.log(`Listening at ${server.addr.hostname}:${server.addr.port}`);
