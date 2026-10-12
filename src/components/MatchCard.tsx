import type { Match } from "@/lib/types";
import { STAGE_LABEL } from "@/lib/types";
import { fmtDate } from "@/lib/format";
import { TeamBadge } from "./TeamBadge";

export function MatchCard({ m }: { m: Match }) {
  const done = m.status === "completed";
  const w1 = done && m.team1_score > m.team2_score;
  const w2 = done && m.team2_score > m.team1_score;
  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold">{STAGE_LABEL[m.stage]}</span>
        <time dateTime={m.match_date}>{fmtDate(m.match_date)}</time>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className={`flex justify-end ${w1 ? "text-emerald-700" : ""}`}>
          <TeamBadge name={m.team1?.name ?? "؟"} logo={m.team1?.logo_url ?? null} size={36} />
        </div>
        <div className="flex min-w-[72px] items-center justify-center gap-2 rounded-lg bg-brand px-3 py-1 text-center text-lg font-extrabold text-white" dir="rtl">
          {done ? (
            <>
              <span>{m.team1_score}</span><span>-</span><span>{m.team2_score}</span>
            </>
          ) : "VS"}
        </div>
        <div className={`flex justify-start ${w2 ? "text-emerald-700" : ""}`}>
          <TeamBadge name={m.team2?.name ?? "؟"} logo={m.team2?.logo_url ?? null} size={36} />
        </div>
      </div>
      {m.status === "cancelled" && <p className="mt-2 text-center text-xs text-red-600">أُلغيت</p>}
    </div>
  );
}
