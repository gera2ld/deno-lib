import dayjs from "https://esm.sh/dayjs@1.11.7";
import utc from "https://esm.sh/dayjs@1.11.7/plugin/utc";
import timezone from "https://esm.sh/dayjs@1.11.7/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export { dayjs };
