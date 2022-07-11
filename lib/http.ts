export async function requestJson<T = unknown>(
  input: string | URL | Request,
  init?: RequestInit,
) {
  const res = await fetch(input, init);
  const data = await res.json() as T;
  if (!res.ok) throw { status: res.status, data };
  return data;
}

export function buildUrl(
  relUrl: string,
  { base, query }: { base?: string; query?: Record<string, string | number> } =
    {},
) {
  const url = new URL(relUrl, base);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value == null) {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, `${value}`);
      }
    });
  }
  return url.toString();
}
