import * as log from "./deps/log.ts";
import { dayjs } from "./dayjs.ts";

const LOGLEVEL = (Deno.env.get("LOGLEVEL") ?? "INFO") as log.LevelName;

await log.setup({
  handlers: {
    console: new log.handlers.PureConsoleHandler(LOGLEVEL, {
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

export const logger = log.getLogger();
