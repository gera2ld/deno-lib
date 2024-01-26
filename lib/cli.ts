export { colors } from "./deps/deno.ts";

export class CommandError extends Error {
  constructor(public code: number, public process: Deno.ChildProcess) {
    super(`Command exit code: ${code}`);
  }
}

export async function runCommand(
  command: string | URL,
  options: Deno.CommandOptions,
) {
  const cmd = new Deno.Command(command, options);
  const p = cmd.spawn();
  const status = await p.status;
  if (!status.success) throw new CommandError(status.code, p);
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

export async function readStdIn() {
  if (Deno.stdin.isTerminal()) {
    return;
  }
  const buffers: Uint8Array[] = [];
  for await (const chunk of Deno.stdin.readable) {
    buffers.push(chunk);
  }
  const size = buffers.map((arr) => arr.length).reduce(
    (prev, cur) => prev + cur,
    0,
  );
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const buffer of buffers) {
    bytes.set(buffer, offset);
    offset += buffer.length;
  }
  const content = new TextDecoder().decode(bytes);
  return content;
}
