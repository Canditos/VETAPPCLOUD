/**
 * Timezone-aware date utilities for VetConnect
 * Defaults to Europe/Lisbon (UTC+0 in winter / WEST UTC+1 in summer)
 */

export function getTimezoneDayBounds(date: Date = new Date(), timeZone: string = "Europe/Lisbon") {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const dateStr = fmt.format(date); // YYYY-MM-DD

  function localToUtc(ymd: string, hms: string, tz: string): Date {
    const invDate = new Date(new Date(`${ymd}T${hms}Z`).toLocaleString("en-US", { timeZone: tz }));
    const diff = invDate.getTime() - new Date(`${ymd}T${hms}Z`).getTime();
    return new Date(new Date(`${ymd}T${hms}Z`).getTime() - diff);
  }

  const startOfDayUtc = localToUtc(dateStr, "00:00:00", timeZone);
  const endOfDayUtc = new Date(localToUtc(dateStr, "23:59:59", timeZone).getTime() + 999);

  return { dateStr, startOfDayUtc, endOfDayUtc };
}

export function getTimezoneDaysInterval(daysCount: number = 14, timeZone: string = "Europe/Lisbon", referenceDate: Date = new Date()) {
  const result: Array<{ dateStr: string; label: string; start: Date; end: Date }> = [];

  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const todayStr = fmt.format(referenceDate);
  const [y, m, d] = todayStr.split("-").map(Number);

  function localToUtc(ymd: string, hms: string, tz: string): Date {
    const invDate = new Date(new Date(`${ymd}T${hms}Z`).toLocaleString("en-US", { timeZone: tz }));
    const diff = invDate.getTime() - new Date(`${ymd}T${hms}Z`).getTime();
    return new Date(new Date(`${ymd}T${hms}Z`).getTime() - diff);
  }

  const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

  for (let i = daysCount - 1; i >= 0; i--) {
    const refDate = new Date(Date.UTC(y, m - 1, d - i, 12, 0, 0));
    const dayStr = fmt.format(refDate);
    const start = localToUtc(dayStr, "00:00:00", timeZone);
    const end = new Date(localToUtc(dayStr, "23:59:59", timeZone).getTime() + 999);

    const [dayY, dayM, dayD] = dayStr.split("-").map(Number);
    const label = `${dayD.toString().padStart(2, "0")} ${months[dayM - 1]}`;

    result.push({ dateStr: dayStr, label, start, end });
  }

  return result;
}
