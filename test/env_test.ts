import { ensureEnv, ensureEnvs } from '../lib/env.ts';
import { assertEquals, assertThrows } from './deps.ts';

Deno.test('ensureEnv', () => {
  const envKey = 'NOT_EXIST_ENV';
  Deno.env.delete(envKey);
  assertThrows(() => {
    ensureEnv(envKey);
  });
  Deno.env.set(envKey, 'ok');
  assertEquals(ensureEnv(envKey), 'ok');
  Deno.env.delete(envKey);
});

Deno.test('ensureEnvs', () => {
  const envKey1 = 'NOT_EXIST_ENV1';
  const envKey2 = 'NOT_EXIST_ENV2';
  Deno.env.set(envKey1, 'ok1');
  Deno.env.delete(envKey2);
  assertThrows(() => {
    ensureEnvs([envKey1, envKey2]);
  });
  Deno.env.set(envKey2, 'ok2');
  assertEquals(ensureEnvs([envKey1, envKey2]), {
    [envKey1]: 'ok1',
    [envKey2]: 'ok2',
  });
  Deno.env.delete(envKey1);
  Deno.env.delete(envKey2);
});
