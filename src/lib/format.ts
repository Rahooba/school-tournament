const dt = new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo" });
export const fmtDate = (iso: string) => dt.format(new Date(iso));

// ---- تواريخ بتوقيت القاهرة (لحقول datetime-local) ----
const TZ = "Africa/Cairo";
function cairoParts(d: Date) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    }).formatToParts(d).map((x) => [x.type, x.value]),
  );
  return p as Record<"year" | "month" | "day" | "hour" | "minute", string>;
}

/** ISO من قاعدة البيانات -> قيمة جاهزة لـ <input type="datetime-local"> بتوقيت القاهرة */
export function toCairoInput(iso: string): string {
  const p = cairoParts(new Date(iso));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/** قيمة datetime-local (بتوقيت القاهرة) -> ISO. بترجع null لو التاريخ غلط */
export function fromCairoInput(local: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(local);
  if (!m) return null;
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const offsetAt = (t: number) => {
    const p = cairoParts(new Date(t));
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - t;
  };
  let t = guess - offsetAt(guess);
  t = guess - offsetAt(t); // تصحيح لو في تغيير توقيت صيفي
  return new Date(t).toISOString();
}
