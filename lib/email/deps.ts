import ImapClientModule from "npm:emailjs-imap-client";
import { IImapClient } from "./types.ts";

export const ImapClient = ImapClientModule.default as typeof IImapClient;

export type {
  AnyNode,
  Cheerio,
  CheerioAPI,
  Element,
} from "https://esm.sh/cheerio@1.0.0-rc.12";
export { load } from "https://esm.sh/cheerio@1.0.0-rc.12";

// @deno-types="npm:@types/mailparser"
export { type ParsedMail, simpleParser } from "npm:mailparser";
