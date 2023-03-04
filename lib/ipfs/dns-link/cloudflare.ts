import { requestJson } from "../../http/util.ts";
import { ensureEnv } from "../../env.ts";

export interface CloudflareConfig {
  token?: string;
}

interface CloudflareDnsZone {
  id: string;
}

interface CloudflareDnsRecord {
  id: string;
}

function request<T = unknown>(
  url: string,
  opts: { method?: string; body?: Record<string, unknown> } & CloudflareConfig,
) {
  const token = opts.token || ensureEnv("CLOUDFLARE_TOKEN");
  return requestJson<T>(url, {
    method: opts.method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: opts.body == null ? null : JSON.stringify(opts.body),
  });
}

async function findZone(name: string, config: CloudflareConfig) {
  const {
    result: [zone],
  } = await request<{ result: CloudflareDnsZone[] }>(
    `https://api.cloudflare.com/client/v4/zones?name=${name}`,
    config,
  );
  return zone;
}

async function findRecord(
  zoneId: string,
  name: string,
  config: CloudflareConfig,
) {
  const {
    result: [record],
  } = await request<{ result: CloudflareDnsRecord[] }>(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?name=${name}&type=TXT`,
    config,
  );
  return record;
}

async function createRecord(
  zoneId: string,
  name: string,
  content: string,
  config: CloudflareConfig,
) {
  await request(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
    {
      ...config,
      method: "POST",
      body: {
        type: "TXT",
        name,
        content,
        ttl: 1,
      },
    },
  );
}

async function updateRecord(
  zoneId: string,
  recordId: string,
  content: string,
  config: CloudflareConfig,
) {
  await request(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${recordId}`,
    {
      ...config,
      method: "PATCH",
      body: {
        content,
      },
    },
  );
}

export async function updateDNSLink(
  /** The top level domain name that you registered. */
  domain: string,
  /** The name of the record, `''` instead of `'@'` for root. */
  name: string,
  ipfsPath: string,
  config: CloudflareConfig,
) {
  const fullname = ["_dnslink", name, domain].filter(Boolean).join(".");
  const content = `dnslink=${ipfsPath}`;
  const zone = await findZone(domain, config);
  const record = await findRecord(zone.id, fullname, config);
  if (record) {
    await updateRecord(zone.id, record.id, content, config);
  } else {
    await createRecord(zone.id, fullname, content, config);
  }
}
