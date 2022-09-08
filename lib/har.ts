/**
 * Usage:
 *
 * $ deno run -A https://raw.githubusercontent.com/gera2ld/deno-lib/main/lib/har.ts --harFile path/to/my-file.har
 */

import { base64, parse, serve } from "./deps/deno.ts";

export interface IKeyValue {
  name: string;
  value: string;
}

export interface IEntryResponse {
  status: number;
  statusText: string;
  headers: IKeyValue[];
  content: {
    size: number;
    mimeType: string;
    text: string;
    encoding?: string;
  };
}

export interface IEntry {
  request: {
    method: string;
    url: string;
    headers: IKeyValue[];
    queryString: IKeyValue[];
  };
  response: IEntryResponse;
}

export interface HarReplayerOptions {
  normalizeUrl: (url: string) => string;
  processResponse: (resp: Response, req: Request) => Response | void;
}

export function loadResponseContent(response: IEntryResponse) {
  const encoding = response.content.encoding;
  const text = response.content.text;
  if (encoding === "base64") return base64.decode(text);
  return text;
}

export class HarReplayer {
  entryMap = new Map<string, IEntry>();

  loading: Promise<void>;

  static defaultOptions: HarReplayerOptions = {
    normalizeUrl: (url: string) => {
      return url.replace(/^https?:\/\/[^/]+/, "");
    },
    processResponse: (resp: Response, req: Request) => {
      const referer = req.headers.get("referer");
      const origin = referer ? new URL(referer).origin : "*";
      resp.headers.set("access-control-allow-origin", origin);
      resp.headers.set("access-control-allow-credentials", "true");
      resp.headers.set("access-control-allow-headers", "content-type");
      resp.headers.delete("content-encoding");
    },
  };

  options: HarReplayerOptions;

  constructor(
    private harFile: string,
    options?: Partial<HarReplayerOptions>,
  ) {
    if (!harFile) throw new Error("harFile is required");
    this.options = {
      ...HarReplayer.defaultOptions,
      ...options,
    };
    this.loading = this.loadHar(harFile);
  }

  async loadHar(path: string) {
    const entryMap = new Map<string, IEntry>();
    const data = JSON.parse(await Deno.readTextFile(path));
    data.log.entries.forEach((entry: IEntry) => {
      const url = this.options.normalizeUrl(entry.request.url);
      entryMap.set(url, entry);
    });
    this.entryMap = entryMap;
  }

  handleRequest = (request: Request) => {
    const url = this.options.normalizeUrl(request.url);
    const entry = this.entryMap.get(url);
    if (!entry) return new Response(null, { status: 404 });
    const body = loadResponseContent(entry.response);
    const headers = entry.response.headers.reduce((prev, pair) => {
      prev[pair.name] = pair.value;
      return prev;
    }, {} as Record<string, string>);
    let resp = new Response(body, { headers });
    resp = this.options.processResponse(resp, request) || resp;
    return resp;
  };

  async start(port: number) {
    console.info(`Using HAR file at: ${this.harFile}`);
    await this.loading;
    await serve(this.handleRequest, { port });
  }
}

if (import.meta.main) {
  const args = parse(Deno.args);
  const port = +args.port || 3600;
  const harFile = args.harFile;
  new HarReplayer(harFile).start(port);
}
