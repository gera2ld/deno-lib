export { colors, readAll } from "./deps/deno.ts";

export async function runCommand(
  command: string | URL,
  options: Deno.CommandOptions,
) {
  const cmd = new Deno.Command(command, options);
  const p = cmd.spawn();
  const status = await p.status;
  if (!status.success) throw new Error(`Exit code: ${status.code}`);
  return p;
}

export async function evalCommand(
  command: string | URL,
  options: Deno.CommandOptions,
) {
  const cmd = new Deno.Command(command, {
    ...options,
    stdout: "piped",
    stderr: "piped",
  });
  const p = cmd.spawn();
  // FIXME: Pipe buffer is limited to 64K, so we must readAll from the stream to get complete data
  const result = await p.output();
  if (!result.success) throw new Error(`Exit code: ${result.code}`);
  const textDecoder = new TextDecoder();
  return {
    stdout: result.stdout && textDecoder.decode(result.stdout),
    stderr: result.stderr && textDecoder.decode(result.stderr),
  };
}
