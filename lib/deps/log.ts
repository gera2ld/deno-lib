import { handlers as builtInHandlers } from "https://deno.land/std/log/mod.ts";

export * from "https://deno.land/std/log/mod.ts";

class PureConsoleHandler extends builtInHandlers.BaseHandler {
  log(msg: string): void {
    console.log(msg);
  }
}

export const handlers = {
  ...builtInHandlers,
  PureConsoleHandler,
};
