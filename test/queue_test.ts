import { Queue } from '../lib/queue.ts';
import { assert, assertEquals } from './deps.ts';

Deno.test('Queue', async () => {
  let tick = 0;
  const queue = new Queue<number>(3);
  queue.put(1);
  queue.put(2);
  queue.put(3);
  assertEquals(queue.size, 3);
  let ts4 = 0;
  const promise4 = queue.put(4).then(() => {
    ts4 = ++tick;
  });
  assertEquals(queue.size, 3);
  let ts5 = 0;
  const promise5 = queue.get().then(res => {
    ts5 = ++tick;
    return res;
  });
  assertEquals(await promise5, 1);
  await promise4;
  assert(ts5 > 0 && ts4 > ts5);
  assertEquals(await queue.get(), 2);
});
