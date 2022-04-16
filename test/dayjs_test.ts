import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { dayjs } from "../lib/dayjs.ts";

Deno.test("dayjs test", () => {
  assertEquals(
    dayjs("2022-01-01 00:00").tz("Asia/Singapore").toISOString(),
    "2021-12-31T16:00:00.000Z",
  );
});
