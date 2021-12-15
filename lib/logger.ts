import {
  ConsoleTransport,
  Houston,
} from "https://x.nest.land/Houston@1.0.8/mod.ts";

export const logger = new Houston([
  new ConsoleTransport(),
]);
