/**
 * Usage:
 *
 * $ deno run -A https://raw.githubusercontent.com/gera2ld/deno-lib/main/lib/har.ts --harFile path/to/my-file.har
 */

 import {
  base64,
  parse,
  readAll,
  readerFromStreamReader,
  serve,
  ServeInit,
} from "./deps/deno.ts";

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
  resolveKey: (
    request: {
      method: string;
      url: string;
      headers?: IKeyValue[] | null;
      body?: string | null;
    },
  ) => string;
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
    resolveKey: (request) => {
      return [
        request.method,
        request.url.replace(/^https?:\/\/[^/]+/, ""),
      ].join(":");
    },
    processResponse: (resp: Response, req: Request) => {
      const origin = req.headers.get("origin") || "*";
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
      const url = this.options.resolveKey(entry.request);
      entryMap.set(`${entry.request.method}:${url}`, entry);
    });
    this.entryMap = entryMap;
  }

  handleRequest = async (request: Request) => {
    const url = this.options.resolveKey({
      method: request.method,
      url: request.url,
      headers: Array.from(
        request.headers.entries(),
        ([name, value]) => ({ name, value }),
      ),
      body: request.body &&
        new TextDecoder().decode(
          await readAll(readerFromStreamReader(request.body.getReader())),
        ),
    });
    const entry = this.entryMap.get(`${request.method}:${url}`);
    let response: Response;
    if (request.method === "OPTIONS") {
      response = new Response();
    } else if (!entry) {
      response = new Response(null, { status: 404 });
    } else {
      const body = loadResponseContent(entry.response);
      const headers = entry.response.headers.reduce((prev, pair) => {
        prev[pair.name] = pair.value;
        return prev;
      }, {} as Record<string, string>);
      response = new Response(body, { headers });
    }
    response = this.options.processResponse(response, request) || response;
    return response;
  };

  async start(options?: ServeInit) {
    console.info(`Using HAR file at: ${this.harFile}`);
    await this.loading;
    await serve(this.handleRequest, {
      port: 3600,
      ...options,
    });
  }
}

if (import.meta.main) {
  const args = parse(Deno.args);
  const options: ServeInit = {};
  if (args.hostname) options.hostname = args.hostname;
  if (args.port) options.port = +args.port;
  const harFile = args.harFile;
  new HarReplayer(harFile).start(options);
}
