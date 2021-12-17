import {
  parseCronExpression,
  TimerBasedCronScheduler,
} from "https://cdn.skypack.dev/cron-schedule@3.0.4?dts";

export function schedule(expression: string, callback: () => void) {
  const cron = parseCronExpression(expression);
  const handle = TimerBasedCronScheduler.setInterval(cron, callback);
  return () => {
    TimerBasedCronScheduler.clearTimeoutOrInterval(handle);
  };
}
