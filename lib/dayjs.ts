import dayjs from "https://cdn.skypack.dev/dayjs";
import utc from "https://cdn.skypack.dev/dayjs/plugin/utc";
import timezone from "https://cdn.skypack.dev/dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export { dayjs };
