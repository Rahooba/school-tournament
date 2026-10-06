export function Flash({ ok, err }: { ok?: string; err?: string }) {
  if (!ok && !err) return null;
  return (
    <p className={`mb-4 rounded-lg p-3 text-sm font-semibold ${err ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
      {err ?? ok}
    </p>
  );
}
