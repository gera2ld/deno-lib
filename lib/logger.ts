import { format } from 'jsr:@std/datetime';
import { BaseHandler, getLogger, type LevelName, setup } from 'jsr:@std/log';

class PureConsoleHandler extends BaseHandler {
  log(msg: string): void {
    console.log(msg);
  }
}

const LOGLEVEL = (Deno.env.get('LOGLEVEL') ?? 'INFO') as LevelName;

setup({
  handlers: {
    console: new PureConsoleHandler(LOGLEVEL, {
      formatter: ({ datetime, levelName, msg }) => {
        const ts = format(datetime, 'yyyy-MM-dd HH:mm:ss');
        return `[${ts}] ${levelName} ${msg}`;
      },
    }),
  },
  loggers: {
    default: {
      level: LOGLEVEL,
      handlers: ['console'],
    },
  },
});

export const logger = getLogger();
