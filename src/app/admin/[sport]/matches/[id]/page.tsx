import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase-server";
import { SPORTS, type SportSlug } from "@/lib/types";
import { Flash } from "@/components/Flash";
import { saveMatchStats } from "../../../actions";

export const dynamic = "force-dynamic";

export default async function MatchStatsAdmin({ params, searchParams }: { params: Promise<{ sport: SportSlug; id: string }>; searchParams: Promise<{ ok?: string; err?: string }> }) {
  const { sport, id } = await params;
  const { ok, err } = await searchParams;
  const s = SPORTS[sport];
  const sb = await supabaseServer();
  const { data: m } = await sb.from("matches")
    .select("id,team1_id,team2_id,team1_score,team2_score,team1:teams!matches_team1_id_fkey(name),team2:teams!matches_team2_id_fkey(name)")
    .eq("id", Number(id)).eq("sport", sport).single();
  if (!m) notFound();

  const [{ data: players }, { data: stats }] = await Promise.all([
    sb.from("players").select("id,name,shirt_no,team_id").in("team_id", [m.team1_id, m.team2_id]).order("shirt_no"),
    sb.from("player_stats").select("player_id,scored").eq("match_id", m.id),
  ]);
  const scored = new Map((stats ?? []).map((x) => [x.player_id, x.scored]));
  const t1 = (m.team1 as unknown as { name: string })?.name, t2 = (m.team2 as unknown as { name: string })?.name;

  const column = (teamId: number, name: string, total: number) => (
    <div className="card p-4">
      <h3 className="mb-1 font-extrabold">{name}</h3>
      <p className="mb-3 text-xs text-slate-500">إجمالي {s.scoreLabel} الفريق: {total}</p>
      <div className="space-y-2">
        {(players ?? []).filter((p) => p.team_id === teamId).map((p) => (
          <div key={p.id} className="flex items-center gap-2">
            <span className="w-7 text-center text-xs font-bold text-slate-400">{p.shirt_no ?? "–"}</span>
            <span className="flex-1 text-sm">{p.name}</span>
            <input name={`p_${p.id}`} type="number" min={0} defaultValue={scored.get(p.id) ?? 0} className="input !w-16 text-center" />
          </div>
        ))}
        {!(players ?? []).some((p) => p.team_id === teamId) && <p className="text-sm text-slate-500">مفيش لاعبين مسجّلين للفريق.</p>}
      </div>
    </div>
  );

  return (
    <form action={saveMatchStats} className="space-y-4">
      <Flash ok={ok} err={err} />
      <input type="hidden" name="sport" value={sport} /><input type="hidden" name="match_id" value={m.id} />
      <h2 className="text-lg font-extrabold">{t1} {m.team1_score} - {m.team2_score} {t2}</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {column(m.team1_id, t1, m.team1_score)}
        {column(m.team2_id, t2, m.team2_score)}
      </div>
      <div className="flex gap-2">
        <button className="btn btn-primary">حفظ إحصائيات اللاعبين</button>
        <Link href={`/admin/${sport}/matches`} className="btn btn-ghost">رجوع</Link>
      </div>
    </form>
  );
}
