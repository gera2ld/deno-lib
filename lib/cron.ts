import {
  parseCronExpression,
  TimerBasedCronScheduler,
} from "https://cdn.jsdelivr.net/npm/cron-schedule/+esm";

export function schedule(expression: string, callback: () => void) {
  const cron = parseCronExpression(expression);
  const handle = TimerBasedCronScheduler.setInterval(cron, callback);
  return () => {
    TimerBasedCronScheduler.clearTimeoutOrInterval(handle);
  };
}
