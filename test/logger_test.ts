import { logger } from '../lib/logger.ts';

Deno.test('logger', () => {
  logger.info('logger ok');
});
