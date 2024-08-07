import { buildUrl } from '../lib/http/util.ts';
import { assertEquals, assertThrows } from 'jsr:@std/assert';

Deno.test('buildUrl', () => {
  assertThrows(() => {
    buildUrl('a');
  });
  assertEquals(
    buildUrl('https://www.google.com/a'),
    'https://www.google.com/a',
  );
  assertEquals(
    buildUrl('https://www.google.com/a', {
      query: {
        a: 1,
        b: 2,
      },
    }),
    'https://www.google.com/a?a=1&b=2',
  );
  assertEquals(
    buildUrl('https://www.google.com/a?a=0&b=0&c=0', {
      query: {
        a: 1,
        b: 2,
      },
    }),
    'https://www.google.com/a?a=1&b=2&c=0',
  );
});
