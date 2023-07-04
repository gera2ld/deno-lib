import { parse } from "../deps/deno.ts";
import { stop, transform } from "../deps/esbuild.ts";

const flags = parse(Deno.args, {
  boolean: ["O"],
  string: ["o", "output"],
});
const [inFile] = flags._;
if (typeof inFile !== "string" || !inFile?.endsWith(".user.ts")) {
  throw new Error('<filename> must end with ".user.ts"');
}
const outFile = flags.O
  ? inFile.replace(/\.ts$/, ".js")
  : (flags.o || flags.output);

const source = await Deno.readTextFile(inFile);
const lines = source.split("\n").map((s) => s.trim());
const start = lines.indexOf("// ==UserScript==");
const end = lines.indexOf("// ==/UserScript==", start);
if (start < 0 || end < 0) throw new Error("Invalid userscript");
const meta = lines.slice(start, end + 1).join("\n");
const result = await transform(source, { loader: "ts" });
stop();
const output = `${meta}\n\n${result.code}`;

if (outFile) {
  await Deno.writeTextFile(outFile, output);
} else {
  console.log(output);
}
