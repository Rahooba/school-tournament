import type { Metadata } from "next";
import { SPORTS, type SportSlug } from "@/lib/types";
import { getBestPlayer, getPlayers, getTopPlayers } from "@/lib/data";
import { TeamLogo } from "@/components/TeamBadge";

export const revalidate = 30;
export const metadata: Metadata = { title: "اللاعبين" };

export default async function PlayersPage({ params }: { params: Promise<{ sport: SportSlug }> }) {
  const { sport } = await params;
  const s = SPORTS[sport];
  const [players, top, best] = await Promise.all([getPlayers(sport), getTopPlayers(sport), getBestPlayer(sport)]);

  const byTeam = new Map<string, typeof players>();
  for (const p of players) {
    const k = p.teams?.name ?? "—";
    byTeam.set(k, [...(byTeam.get(k) ?? []), p]);
  }

  return (
    <div className="space-y-8">
      {best && (
        <section className="card flex items-center gap-4 border-2 border-amber-300 p-4">
          <TeamLogo url={best.player.photo_url} name={best.player.name} size={72} />
          <div>
            <div className="text-xs font-bold text-amber-600">⭐ أفضل لاعب في {s.name}</div>
            <div className="text-xl font-extrabold">{best.player.name}</div>
            <div className="text-sm text-slate-500">{best.player.teams?.name}</div>
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-extrabold">🔥 الهدّافين ({s.scoreLabel})</h2>
        {top.length ? (
          <div className="card divide-y divide-slate-100">
            {top.map((p, i) => (
              <div key={p.player_id} className="flex items-center gap-3 p-3">
                <span className="w-6 text-center font-extrabold text-slate-400">{i + 1}</span>
                <TeamLogo url={p.photo_url} name={p.name} size={36} />
                <div className="flex-1">
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-xs text-slate-500">{p.team_name}</div>
                </div>
                <span className="rounded-full px-3 py-1 text-sm font-extrabold text-white" style={{ background: s.accent }}>{p.total_scored}</span>
              </div>
            ))}
          </div>
        ) : <p className="card p-5 text-center text-slate-500">لسه مفيش إحصائيات.</p>}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-extrabold">👥 قوائم الفرق</h2>
        {byTeam.size ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[...byTeam.entries()].map(([team, list]) => (
              <div key={team} className="card overflow-hidden">
                <div className="px-4 py-2 font-bold text-white" style={{ background: s.accent }}>{team}</div>
                <ul className="divide-y divide-slate-100">
                  {list.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 px-4 py-2 text-sm">
                      <span className="w-7 text-center font-extrabold text-slate-400">{p.shirt_no ?? "–"}</span>
                      <span className="flex-1 font-semibold">{p.name}</span>
                      <span className="text-xs text-slate-500">{p.position}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : <p className="card p-5 text-center text-slate-500">لسه ماتضافش لاعبين.</p>}
      </section>
    </div>
  );
}
