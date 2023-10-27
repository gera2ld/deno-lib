/**
 * Usage:
 *
 * $ deno run -A https://raw.githubusercontent.com/gera2ld/deno-lib/main/lib/database/sqlite.ts path/to/db.sqlite
 */

import { DB, SqliteOptions } from "https://deno.land/x/sqlite@v3.7.0/mod.ts";
import { parse } from "../deps/deno.ts";

const args = parse(Deno.args);
const listenOptions: Deno.ServeOptions = {
  hostname: args.hostname || "[::]",
  port: +args.port || 3601,
};
const dbOptions: SqliteOptions = {};
if (args.mode) dbOptions.mode = args.mode;
const file = args._[0] as string;

async function handleRequest(request: Request) {
  const query = await request.json();
  try {
    const db = new DB(file, dbOptions);
    const rows = db.query(query.sql, query.params);
    db.close();
    return new Response(JSON.stringify({ result: rows }), {
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: `${err}` }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

Deno.serve(listenOptions, handleRequest);
