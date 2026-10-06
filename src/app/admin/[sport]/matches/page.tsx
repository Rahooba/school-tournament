import Link from "next/link";
import { supabaseServer } from "@/lib/supabase-server";
import { SPORTS, STAGE_LABEL, type Match, type SportSlug } from "@/lib/types";
import { fmtDate } from "@/lib/format";
import { Flash } from "@/components/Flash";
import { createFinal, deleteMatch, generateFixtures, saveResult } from "../../actions";

export const dynamic = "force-dynamic";

export default async function MatchesAdmin({ params, searchParams }: { params: Promise<{ sport: SportSlug }>; searchParams: Promise<{ ok?: string; err?: string }> }) {
  const { sport } = await params;
  const { ok, err } = await searchParams;
  const s = SPORTS[sport];
  const sb = await supabaseServer();
  const { data } = await sb.from("matches")
    .select("id,sport,team1_id,team2_id,team1_score,team2_score,match_date,status,stage,team1:teams!matches_team1_id_fkey(name,logo_url),team2:teams!matches_team2_id_fkey(name,logo_url)")
    .eq("sport", sport).order("stage").order("match_date");
  const matches = (data ?? []) as unknown as Match[];

  return (
    <div className="space-y-5">
      <Flash ok={ok} err={err} />

      <div className="grid gap-4 md:grid-cols-2">
        <form action={generateFixtures} className="card space-y-3 p-4">
          <input type="hidden" name="sport" value={sport} />
          <h2 className="font-extrabold">🗓️ إنشاء مباريات الدوري تلقائي</h2>
          <p className="text-xs text-slate-500">كل فريق بيلاعب كل فريق مرة واحدة. المباريات الموجودة مش بتتكرر.</p>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">أول مباراة</label><input name="start" type="datetime-local" required className="input" /></div>
            <div><label className="label">دقائق بين المباريات</label><input name="gap" type="number" defaultValue={60} min={10} className="input" /></div>
          </div>
          <button className="btn btn-primary">إنشاء الجدول</button>
        </form>

        <form action={createFinal} className="card space-y-3 p-4">
          <input type="hidden" name="sport" value={sport} />
          <h2 className="font-extrabold">🏁 تحديد النهائي</h2>
          <p className="text-xs text-slate-500">بياخد أول فريقين في الترتيب (بالنقاط ثم فارق الأهداف) ويعمل بينهم النهائي.</p>
          <div><label className="label">موعد النهائي</label><input name="date" type="datetime-local" required className="input" /></div>
          <button className="btn btn-primary">إنشاء النهائي</button>
        </form>
      </div>

      <div className="space-y-3">
        {matches.length === 0 && <p className="card p-5 text-center text-slate-500">مفيش مباريات. ابدأ بإنشاء الجدول.</p>}
        {matches.map((m) => (
          <div key={m.id} className="card p-4">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold">{STAGE_LABEL[m.stage]}</span>
              <span>{fmtDate(m.match_date)} — {m.status === "completed" ? "انتهت" : "قادمة"}</span>
            </div>
            <form action={saveResult} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="sport" value={sport} /><input type="hidden" name="id" value={m.id} />
              <span className="min-w-24 flex-1 text-left font-bold">{m.team1?.name}</span>
              <input name="s1" type="number" min={0} defaultValue={m.team1_score} className="input !w-16 text-center" aria-label={`${s.scoreLabel} ${m.team1?.name}`} />
              <span>-</span>
              <input name="s2" type="number" min={0} defaultValue={m.team2_score} className="input !w-16 text-center" aria-label={`${s.scoreLabel} ${m.team2?.name}`} />
              <span className="min-w-24 flex-1 font-bold">{m.team2?.name}</span>
              <button className="btn btn-primary">حفظ النتيجة</button>
              {m.status === "completed" && <Link href={`/admin/${sport}/matches/${m.id}`} className="btn btn-ghost">اللاعبين</Link>}
            </form>
            <form action={deleteMatch} className="mt-2 text-left">
              <input type="hidden" name="sport" value={sport} /><input type="hidden" name="id" value={m.id} />
              <button className="text-xs text-red-600 hover:underline">حذف المباراة</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
