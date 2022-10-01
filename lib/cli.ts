import { readAll } from "./deps/deno.ts";

export { colors, readAll } from "./deps/deno.ts";

export async function runCommand(options: Deno.RunOptions) {
  const p = Deno.run(options);
  const status = await p.status();
  if (!status.success) throw new Error(`Exit code: ${status.code}`);
  return p;
}

export async function evalCommand(cmd: string[]) {
  const p = Deno.run({
    cmd,
    stdout: "piped",
    stderr: "piped",
  });
  // Pipe buffer is limited to 64K, so we must readAll from the stream to get complete data
  const [status, stdout, stderr] = await Promise.all([
    p.status(),
    p.stdout && readAll(p.stdout),
    p.stderr && readAll(p.stderr),
  ]);
  if (!status.success) throw new Error(`Exit code: ${status.code}`);
  const textDecoder = new TextDecoder();
  return {
    stdout: stdout && textDecoder.decode(stdout),
    stderr: stderr && textDecoder.decode(stderr),
  };
}
