import {
  getLogger,
  handlers as builtInHandlers,
  LevelName,
  setup,
} from "./deps.ts";
import { dayjs } from "./dayjs.ts";

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
        const time = dayjs(datetime).format("YYYY-MM-DD HH:mm:ss");
        return `[${time}] ${levelName} ${msg}`;
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
