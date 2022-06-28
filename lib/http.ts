export async function requestJson<T = unknown>(
  input: string | URL | Request,
  init?: RequestInit,
) {
  const res = await fetch(input, init);
  const data = await res.json() as T;
  if (!res.ok) throw { status: res.status, data };
  return data;
}
