import { ensureEnvs } from "../env.ts";
import { ImapClient } from "./deps.ts";
import { type IImapClient, type IImapOptions, ImapLogLevel } from "./types.ts";

export function imapOptionsFromEnv(): IImapOptions {
  const { IMAP_HOST, IMAP_PORT, IMAP_USER, IMAP_PASSWORD } = ensureEnvs([
    "IMAP_HOST",
    "IMAP_PORT",
    "IMAP_USER",
    "IMAP_PASSWORD",
  ]);
  const logLevel = Deno.env.get("IMAP_LOG_LEVEL");
  return {
    host: IMAP_HOST,
    port: +IMAP_PORT,
    user: IMAP_USER,
    password: IMAP_PASSWORD,
    logLevel: logLevel ? +logLevel : undefined,
  };
}

export async function imapTransaction(
  options: IImapOptions,
  cb: (client: IImapClient) => Promise<void>,
) {
  const {
    host,
    port,
    user,
    password,
    logLevel = ImapLogLevel.INFO,
  } = options;
  const client = new ImapClient(host, port, {
    logLevel,
    auth: {
      user,
      pass: password,
    },
    // id: { name: 'deno-lib-imap', version: '1.0.0' },
    // Always use STARTTLS
    requireTLS: true,
    enableCompression: true,
  });
  try {
    await client.connect();
    await cb(client);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.close();
  }
}
