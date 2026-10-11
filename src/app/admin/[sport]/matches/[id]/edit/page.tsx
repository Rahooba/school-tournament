import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase-server";
import { SPORTS, type Match, type SportSlug } from "@/lib/types";
import { Flash } from "@/components/Flash";
import { MatchForm } from "@/components/MatchForm";
import { updateMatch } from "../../../../actions";

export const dynamic = "force-dynamic";

export default async function EditMatch({ params, searchParams }: { params: Promise<{ sport: SportSlug; id: string }>; searchParams: Promise<{ ok?: string; err?: string }> }) {
  const { sport, id } = await params;
  const { ok, err } = await searchParams;
  const s = SPORTS[sport];
  const sb = await supabaseServer();
  const [{ data: m }, { data: teams }] = await Promise.all([
    sb.from("matches").select("id,team1_id,team2_id,team1_score,team2_score,match_date,status,stage").eq("id", Number(id)).eq("sport", sport).single(),
    sb.from("teams").select("id,name").eq("sport", sport).order("name"),
  ]);
  if (!m) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Link href={`/admin/${sport}/matches`} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-800">→ رجوع للمباريات</Link>
      <div className="card p-4 sm:p-6">
        <Flash ok={ok} err={err} />
        <h2 className="mb-4 text-lg font-extrabold">✏️ تعديل المباراة</h2>
        <MatchForm action={updateMatch} sport={sport} teams={teams ?? []} match={m as Match} submitLabel="حفظ التعديلات" scoreLabel={s.scoreLabel} />
      </div>
    </div>
  );
}
