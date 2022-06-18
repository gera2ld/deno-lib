import {
  parseCronExpression,
  TimerBasedCronScheduler,
} from "https://cdn.jsdelivr.net/npm/cron-schedule/+esm";

export function schedule(expression: string, callback: () => void) {
  const cron = parseCronExpression(expression);
  const handle = TimerBasedCronScheduler.setInterval(cron, callback, {});
  return async () => {
    // The next timer will be created after the task callback,
    // so let's wait until next tick in case this function is called inside a task callback.
    await Promise.resolve();
    TimerBasedCronScheduler.clearTimeoutOrInterval(handle);
  };
}
