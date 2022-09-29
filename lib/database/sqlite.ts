/**
 * Usage:
 *
 * $ deno run -A https://raw.githubusercontent.com/gera2ld/deno-lib/main/lib/database/sqlite.ts path/to/db.sqlite
 */

import { DB } from "https://deno.land/x/sqlite/mod.ts";
import { parse, serve, ServeInit } from "../deps/deno.ts";

const args = parse(Deno.args);
const options: ServeInit = {};
if (args.hostname) options.hostname = args.hostname;
options.port = +args.port || 3601;
const file = args._[0] as string;

const db = new DB(file);

async function handleRequest(request: Request) {
  const query = await request.json();
  try {
    const rows = db.query(query.sql, query.params);
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

serve(handleRequest, options);
