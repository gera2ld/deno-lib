import { schedule } from '../lib/cron.ts';

Deno.test('cron test', () => new Promise(resolve => {
  const dispose = schedule('*/2 * * * * *', () => {
    dispose();
    resolve();
  });
}));
