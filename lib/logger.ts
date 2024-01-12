import {
  BaseHandler,
  formatTime,
  getLogger,
  LevelName,
  setup,
} from "./deps/deno.ts";

class PureConsoleHandler extends BaseHandler {
  log(msg: string): void {
    console.log(msg);
  }
}

const LOGLEVEL = (Deno.env.get("LOGLEVEL") ?? "INFO") as LevelName;

setup({
  handlers: {
    console: new PureConsoleHandler(LOGLEVEL, {
      formatter: ({ datetime, levelName, msg }) => {
        const ts = formatTime(datetime, "yyyy-MM-dd HH:mm:ss");
        return `[${ts}] ${levelName} ${msg}`;
      },
    }),
  },
  loggers: {
    default: {
      level: LOGLEVEL,
      handlers: ["console"],
    },
  },
});

export const logger = getLogger();
