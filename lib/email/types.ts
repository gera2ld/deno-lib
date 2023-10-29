export enum ImapLogLevel {
  ALL = 0,
  DEBUG = 10,
  INFO = 20,
  WARN = 30,
  ERROR = 40,
  NONE = 1000,
}

export interface IImapOptions {
  host: string;
  port: number;
  user: string;
  password: string;
  logLevel?: ImapLogLevel;
}

export interface IMailbox {
  root?: boolean;
  name: string;
  path: string;
  delimiter: string;
  listed: boolean;
  subscribed: boolean;
  specialUse?: string;
  specialUseFlag?: string;
  flags: string[];
  children?: IMailbox[];
}

export declare class IImapClient {
  constructor(host: string, port: number, options: any);
  connect(): Promise<void>;
  listMailboxes(): Promise<IMailbox>;
  listMessages(
    path: string,
    sequence: string,
    query: string[],
    options?: { byUid?: boolean },
  ): Promise<any[]>;
  search(
    path: string,
    query: any,
    options?: { byUid?: boolean },
  ): Promise<number[]>;
  setFlags(
    path: string,
    sequence: string,
    flags: { set?: string[]; add?: string[]; removed?: string[] },
    options?: { byUid?: boolean },
  ): Promise<any[]>;
  close(): Promise<void>;
}
