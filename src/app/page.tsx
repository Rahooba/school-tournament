import Link from "next/link";
import { SPORTS, type SportSlug } from "@/lib/types";
import { getTournamentStatus } from "@/lib/data";
import { StandingsTable } from "@/components/StandingsTable";
import { TeamBadge } from "@/components/TeamBadge";

export const revalidate = 30;

async function SportCard({ slug }: { slug: SportSlug }) {
  const s = SPORTS[slug];
  const st = await getTournamentStatus(slug);
  return (
    <section className="card overflow-hidden">
      <div className="flex items-center justify-between p-4 text-white" style={{ background: s.accent }}>
        <h2 className="text-xl font-extrabold">{s.icon} {s.name}</h2>
        <span className="rounded-full bg-white/20 px-3 py-0.5 text-xs font-semibold">
          {st.played} / {st.total || "—"} مباراة
        </span>
      </div>
      {st.champion && (
        <div className="bg-amber-50 p-3 text-center text-sm font-bold text-amber-700">
          🏆 البطل: <TeamBadge name={st.champion.name} logo={st.champion.logo_url} size={24} />
        </div>
      )}
      <StandingsTable rows={st.standings} accent={s.accent} limit={5} />
      <div className="p-3 text-center">
        <Link href={`/${slug}`} className="btn btn-primary">التفاصيل الكاملة</Link>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-l from-brand to-brand-2 p-6 text-white">
        <h1 className="text-2xl font-extrabold">🏆 دوري المدرسة</h1>
        <p className="mt-1 text-white/80">تابع نتائج وترتيب كرة القدم والكرة الطائرة، وأفضل اللاعبين.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <SportCard slug="football" />
        <SportCard slug="volleyball" />
      </div>
    </div>
  );
}
