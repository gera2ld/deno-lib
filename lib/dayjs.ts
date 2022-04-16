import dayjs from "https://cdn.jsdelivr.net/npm/dayjs/+esm";
import utc from "https://cdn.jsdelivr.net/npm/dayjs/plugin/utc/+esm";
import timezone from "https://cdn.jsdelivr.net/npm/dayjs/plugin/timezone/+esm";

dayjs.extend(utc);
dayjs.extend(timezone);

export { dayjs };
