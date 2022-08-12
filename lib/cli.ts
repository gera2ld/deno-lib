export { colors } from "./deps/deno.ts";

export async function runCommand(
  cmd: string[],
  opts?: Omit<Deno.RunOptions, "cmd">,
) {
  const p = Deno.run({ ...opts, cmd });
  const status = await p.status();
  if (!status.success) throw new Error(`Exit code: ${status.code}`);
  return p;
}

export async function evalCommand(cmd: string[]) {
  const p = await runCommand(cmd, { stdout: "piped" });
  const output = await p.output();
  return new TextDecoder().decode(output);
}
