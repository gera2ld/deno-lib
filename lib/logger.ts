import {
  formatTime,
  getLogger,
  handlers as builtInHandlers,
  LevelName,
  setup,
} from "./deps/deno.ts";

class PureConsoleHandler extends builtInHandlers.BaseHandler {
  log(msg: string): void {
    console.log(msg);
  }
}

export const handlers = {
  ...builtInHandlers,
  PureConsoleHandler,
};

const LOGLEVEL = (Deno.env.get("LOGLEVEL") ?? "INFO") as LevelName;

await setup({
  handlers: {
    console: new handlers.PureConsoleHandler(LOGLEVEL, {
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
