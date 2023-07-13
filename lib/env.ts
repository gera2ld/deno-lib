import { load, type LoadOptions } from "./deps/deno.ts";

export function loadEnv(param?: LoadOptions) {
  return load({
    export: true,
    ...param,
  });
}

export function ensureEnv(key: string): string {
  const value = Deno.env.get(key);
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

export function ensureEnvs(keys: string[]) {
  const env: Record<string, string> = {};
  const missing: string[] = [];
  for (const key of keys) {
    try {
      const value = ensureEnv(key);
      env[key] = value;
    } catch {
      missing.push(key);
    }
  }
  if (missing.length) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }
  return env;
}
