export { colors } from "./deps/deno.ts";

export class CommandError extends Error {
  constructor(public output: Deno.CommandStatus) {
    super(`Command exit code: ${output.code}`);
  }
}

async function getCommandOutput(command: Deno.Command) {
  const output = await command.output();
  const decoder = new TextDecoder();
  return {
    code: output.code,
    success: output.success,
    signal: output.signal,
    get stdout() {
      return decoder.decode(output.stdout);
    },
    get stderr() {
      return decoder.decode(output.stderr);
    },
  };
}

export function runCommand(
  command: string | URL,
  options: Deno.CommandOptions,
) {
  const cmd = new Deno.Command(command, options);
  return {
    async output(ensureSuccess = true) {
      const output = await getCommandOutput(cmd);
      if (ensureSuccess && !output.success) {
        throw new CommandError(output);
      }
      return output;
    },
    async spawn(ensureSuccess = true) {
      const child = cmd.spawn();
      const status = await child.status;
      if (ensureSuccess && !status.success) {
        throw new CommandError(status);
      }
      return status;
    },
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
  const size = buffers
    .map((arr) => arr.length)
    .reduce((prev, cur) => prev + cur, 0);
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const buffer of buffers) {
    bytes.set(buffer, offset);
    offset += buffer.length;
  }
  const content = new TextDecoder().decode(bytes);
  return content;
}
