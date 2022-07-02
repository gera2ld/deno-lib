import { buildUrl } from '../lib/http.ts';
import { assertEquals, assertThrows } from './deps.ts';

Deno.test('buildUrl', () => {
  assertThrows(() => {
    buildUrl('a');
  });
  assertEquals(buildUrl('https://www.google.com/a'), 'https://www.google.com/a');
  assertEquals(buildUrl('https://www.google.com/a', {
    query: {
      a: 1,
      b: 2,
    },
  }), 'https://www.google.com/a?a=1&b=2');
  assertEquals(buildUrl('https://www.google.com/a?a=0&b=0&c=0', {
    query: {
      a: 1,
      b: 2,
    },
  }), 'https://www.google.com/a?a=1&b=2&c=0');
});
