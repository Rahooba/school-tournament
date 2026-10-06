import type { Standing } from "@/lib/types";
import { TeamBadge } from "./TeamBadge";

export function StandingsTable({ rows, accent, limit }: { rows: Standing[]; accent: string; limit?: number }) {
  const data = limit ? rows.slice(0, limit) : rows;
  if (!data.length) return <p className="p-6 text-center text-slate-500">لا توجد فرق بعد.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px]">
        <thead style={{ background: accent }}>
          <tr>
            <th className="th">#</th>
            <th className="th text-right">الفريق</th>
            <th className="th">لعب</th><th className="th">فاز</th><th className="th">تعادل</th><th className="th">خسر</th>
            <th className="th">له</th><th className="th">عليه</th><th className="th">فارق</th><th className="th">نقاط</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((r, i) => (
            <tr key={r.team_id} className={i < 2 ? "bg-emerald-50" : ""}>
              <td className="td font-bold">{i === 0 ? "🏆" : i + 1}</td>
              <td className="td text-right"><TeamBadge name={r.name} logo={r.logo_url} /></td>
              <td className="td">{r.played}</td><td className="td">{r.won}</td><td className="td">{r.drawn}</td><td className="td">{r.lost}</td>
              <td className="td">{r.gf}</td><td className="td">{r.ga}</td>
              <td className="td" dir="ltr">{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
              <td className="td text-base font-extrabold">{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="px-4 py-2 text-xs text-slate-500">أول فريقين (مظلّلين بالأخضر) هما اللي بيلعبوا النهائي.</p>
    </div>
  );
}
