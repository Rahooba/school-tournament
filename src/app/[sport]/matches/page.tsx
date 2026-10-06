import type { Metadata } from "next";
import { SPORTS, type SportSlug } from "@/lib/types";
import { getMatches } from "@/lib/data";
import { MatchCard } from "@/components/MatchCard";

export const revalidate = 30;
export const metadata: Metadata = { title: "المباريات" };

export default async function MatchesPage({ params }: { params: Promise<{ sport: SportSlug }> }) {
  const { sport } = await params;
  const [upcoming, done] = await Promise.all([
    getMatches(sport, { status: "scheduled" }),
    getMatches(sport, { status: "completed", limit: 40 }),
  ]);
  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-lg font-extrabold">⏰ المباريات القادمة</h2>
        {upcoming.length ? (
          <div className="grid gap-3 md:grid-cols-2">{upcoming.map((m) => <MatchCard key={m.id} m={m} />)}</div>
        ) : <p className="card p-5 text-center text-slate-500">مفيش مباريات قادمة.</p>}
      </section>
      <section>
        <h2 className="mb-3 text-lg font-extrabold">✅ آخر النتائج ({SPORTS[sport].scoreLabel})</h2>
        {done.length ? (
          <div className="grid gap-3 md:grid-cols-2">{done.map((m) => <MatchCard key={m.id} m={m} />)}</div>
        ) : <p className="card p-5 text-center text-slate-500">لسه مفيش نتائج.</p>}
      </section>
    </div>
  );
}
