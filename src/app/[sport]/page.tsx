import type { Metadata } from "next";
import { SPORTS, type SportSlug } from "@/lib/types";
import { getBestPlayer, getTournamentStatus } from "@/lib/data";
import { StandingsTable } from "@/components/StandingsTable";
import { MatchCard } from "@/components/MatchCard";
import { TeamBadge, TeamLogo } from "@/components/TeamBadge";

export const revalidate = 30;

export async function generateMetadata({ params }: { params: Promise<{ sport: SportSlug }> }): Promise<Metadata> {
  const { sport } = await params;
  return { title: `ترتيب ${SPORTS[sport].name}` };
}

export default async function SportPage({ params }: { params: Promise<{ sport: SportSlug }> }) {
  const { sport } = await params;
  const s = SPORTS[sport];
  const [st, best] = await Promise.all([getTournamentStatus(sport), getBestPlayer(sport)]);
  const pct = st.total ? Math.round((st.played / st.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {st.champion && (
        <div className="rounded-2xl bg-gradient-to-l from-amber-400 to-yellow-300 p-5 text-center text-amber-950 shadow">
          <div className="text-3xl">🏆</div>
          <div className="text-sm font-semibold">بطل {s.name}</div>
          <div className="mt-1 flex justify-center text-xl font-extrabold">
            <TeamBadge name={st.champion.name} logo={st.champion.logo_url} size={40} />
          </div>
        </div>
      )}

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between p-4 text-white" style={{ background: s.accent }}>
          <h2 className="font-extrabold">جدول الدوري</h2>
          <span className="text-xs">{st.played} من {st.total || "—"} مباراة ({pct}%)</span>
        </div>
        <div className="h-1.5 bg-slate-200"><div className="h-full" style={{ width: `${pct}%`, background: s.accent }} /></div>
        <StandingsTable rows={st.standings} accent={s.accent} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-extrabold">🏁 المباراة النهائية</h2>
        {st.final ? <MatchCard m={st.final} /> : (
          <p className="card p-5 text-center text-slate-500">
            {st.leagueDone ? "الدوري خلص — هيتحدد موعد النهائي قريب." : "النهائي بيتحدد بعد ما كل الفرق تلاعب بعض."}
          </p>
        )}
      </section>

      {best && (
        <section className="card flex items-center gap-4 p-4">
          <TeamLogo url={best.player.photo_url} name={best.player.name} size={64} />
          <div>
            <div className="text-xs font-bold text-amber-600">⭐ أفضل لاعب</div>
            <div className="text-lg font-extrabold">{best.player.name}</div>
            <div className="text-sm text-slate-500">{best.player.teams?.name}</div>
            {best.note && <div className="mt-1 text-sm text-slate-600">{best.note}</div>}
          </div>
        </section>
      )}
    </div>
  );
}
