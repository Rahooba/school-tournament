const dt = new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo" });
export const fmtDate = (iso: string) => dt.format(new Date(iso));
