import Link from "next/link";
import { supabaseServer } from "@/lib/supabase-server";
import { SPORTS, STAGE_LABEL, type Match, type SportSlug } from "@/lib/types";
import { fmtDate } from "@/lib/format";
import { Flash } from "@/components/Flash";
import { MatchForm } from "@/components/MatchForm";
import { Collapsible } from "@/components/Collapsible";
import { ConfirmButton } from "@/components/ConfirmButton";
import { TeamLogo } from "@/components/TeamBadge";
import { createFinal, createMatch, deleteMatch, saveResult } from "../../actions";

export const dynamic = "force-dynamic";

type Filter = "all" | "scheduled" | "completed";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "scheduled", label: "القادمة" },
  { key: "completed", label: "المنتهية" },
];
const STATUS = {
  completed: { label: "انتهت", cls: "bg-emerald-100 text-emerald-700" },
  scheduled: { label: "قادمة", cls: "bg-amber-100 text-amber-700" },
  cancelled: { label: "ملغية", cls: "bg-red-100 text-red-700" },
} as const;
const STAGES: { key: Match["stage"]; icon: string }[] = [
  { key: "final", icon: "🏆" },
  { key: "third_place", icon: "🥉" },
  { key: "league", icon: "📅" },
];

function TeamSide({ name, logo, win }: { name?: string; logo?: string | null; win: boolean }) {
  return (
    <div className={`flex min-w-0 flex-col items-center gap-1.5 text-center ${win ? "text-emerald-700" : ""}`}>
      <TeamLogo url={logo ?? null} name={name ?? "؟"} size={44} />
      <span className="max-w-full break-words text-sm font-bold leading-tight sm:text-base">{name ?? "؟"}</span>
    </div>
  );
}

function MatchItem({ m, sport, scoreLabel }: { m: Match; sport: SportSlug; scoreLabel: string }) {
  const st = STATUS[m.status];
  const done = m.status === "completed";
  const cancelled = m.status === "cancelled";
  const w1 = done && m.team1_score > m.team2_score;
  const w2 = done && m.team2_score > m.team1_score;
  const scoreInput = "input !w-14 !px-1 text-center text-xl font-extrabold sm:!w-16";

  return (
    <article className={`card overflow-hidden ${cancelled ? "opacity-70" : ""}`}>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-2 text-xs">
        <span className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 font-bold ${st.cls}`}>{st.label}</span>
          <span className="font-semibold text-slate-500">{STAGE_LABEL[m.stage]}</span>
        </span>
        <time dateTime={m.match_date} className="text-slate-500">📅 {fmtDate(m.match_date)}</time>
      </header>

      <form action={saveResult} className="space-y-4 p-4">
        <input type="hidden" name="sport" value={sport} />
        <input type="hidden" name="id" value={m.id} />

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
          <TeamSide name={m.team1?.name} logo={m.team1?.logo_url} win={w1} />
          {cancelled ? (
            <span className="rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-extrabold text-slate-500">VS</span>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2" dir="ltr">
              <input name="s1" type="number" min={0} defaultValue={m.team1_score} className={scoreInput} aria-label={`${scoreLabel} ${m.team1?.name}`} />
              <span className="font-bold text-slate-400">:</span>
              <input name="s2" type="number" min={0} defaultValue={m.team2_score} className={scoreInput} aria-label={`${scoreLabel} ${m.team2?.name}`} />
            </div>
          )}
          <TeamSide name={m.team2?.name} logo={m.team2?.logo_url} win={w2} />
        </div>

        {!cancelled && (
          <button className="btn btn-primary w-full sm:mx-auto sm:flex sm:w-auto sm:min-w-48">
            {done ? "تحديث النتيجة" : "حفظ النتيجة وإنهاء المباراة"}
          </button>
        )}
      </form>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-2.5">
        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/${sport}/matches/${m.id}/edit`} className="btn btn-ghost !px-3 !py-1.5 !text-xs">✏️ تعديل</Link>
          {done && <Link href={`/admin/${sport}/matches/${m.id}`} className="btn btn-ghost !px-3 !py-1.5 !text-xs">👥 اللاعبين</Link>}
        </div>
        <form action={deleteMatch}>
          <input type="hidden" name="sport" value={sport} />
          <input type="hidden" name="id" value={m.id} />
          <ConfirmButton message="متأكدة إنك عايزة تحذفي المباراة دي؟" className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50">
            🗑️ حذف
          </ConfirmButton>
        </form>
      </footer>
    </article>
  );
}

export default async function MatchesAdmin({ params, searchParams }: { params: Promise<{ sport: SportSlug }>; searchParams: Promise<{ ok?: string; err?: string; f?: string }> }) {
  const { sport } = await params;
  const { ok, err, f } = await searchParams;
  const filter: Filter = f === "scheduled" || f === "completed" ? f : "all";
  const s = SPORTS[sport];
  const sb = await supabaseServer();

  const [{ data }, { data: teams }] = await Promise.all([
    sb.from("matches")
      .select("id,sport,team1_id,team2_id,team1_score,team2_score,match_date,status,stage,team1:teams!matches_team1_id_fkey(name,logo_url),team2:teams!matches_team2_id_fkey(name,logo_url)")
      .eq("sport", sport).order("match_date"),
    sb.from("teams").select("id,name").eq("sport", sport).order("name"),
  ]);
  const all = (data ?? []) as unknown as Match[];
  const count = (st: Match["status"]) => all.filter((m) => m.status === st).length;
  const shown = all.filter((m) => filter === "all" || m.status === filter);

  return (
    <div className="space-y-5">
      <Flash ok={ok} err={err} />

      <div className="grid gap-5 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start">
        {/* ---------- الإضافة (سايد بار على الشاشات الكبيرة) ---------- */}
        <aside className="space-y-4 lg:sticky lg:top-4">
          <Collapsible title="➕ إضافة مباراة جديدة" forceOpen={!!err}>
            <p className="mb-4 text-xs text-slate-500">اختاري الفريقين والموعد. ولو المباراة خلصت اختاري «انتهت» واكتبي النتيجة — وتقدري تعدليها بعد كده.</p>
            <MatchForm action={createMatch} sport={sport} teams={teams ?? []} submitLabel="إضافة المباراة" scoreLabel={s.scoreLabel} />
          </Collapsible>

          <Collapsible title="🏁 تحديد النهائي">
            <form action={createFinal} className="space-y-3">
              <input type="hidden" name="sport" value={sport} />
              <p className="text-xs text-slate-500">بياخد أول فريقين في الترتيب (بالنقاط ثم فارق {s.scoreLabel}) ويعمل بينهم النهائي.</p>
              <div>
                <label className="label">موعد النهائي</label>
                <input name="date" type="datetime-local" required className="input" />
              </div>
              <button className="btn btn-primary w-full">إنشاء النهائي</button>
            </form>
          </Collapsible>
        </aside>

        {/* ---------- قائمة المباريات ---------- */}
        <section className="min-w-0 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold">المباريات</h2>
              <p className="text-xs text-slate-500">{all.length} مباراة · {count("scheduled")} قادمة · {count("completed")} انتهت</p>
            </div>
            <nav className="flex gap-1.5 overflow-x-auto" aria-label="تصفية المباريات">
              {FILTERS.map((x) => (
                <Link key={x.key} href={x.key === "all" ? `/admin/${sport}/matches` : `/admin/${sport}/matches?f=${x.key}`}
                  className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold ${filter === x.key ? "bg-brand text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}>
                  {x.label}
                </Link>
              ))}
            </nav>
          </div>

          {shown.length === 0 && (
            <div className="card grid place-items-center gap-1 p-10 text-center">
              <span className="text-4xl">{s.icon}</span>
              <p className="font-bold">{all.length === 0 ? "مفيش مباريات لسه" : "مفيش مباريات في التصنيف ده"}</p>
              {all.length === 0 && <p className="text-xs text-slate-500">ابدأي بإضافة أول مباراة من الفورم.</p>}
            </div>
          )}

          {STAGES.map(({ key, icon }) => {
            const list = shown.filter((m) => m.stage === key);
            if (!list.length) return null;
            return (
              <div key={key} className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-700">
                  <span>{icon}</span>{STAGE_LABEL[key]}
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-600">{list.length}</span>
                </h3>
                <div className="grid gap-3 xl:grid-cols-2">
                  {list.map((m) => <MatchItem key={m.id} m={m} sport={sport} scoreLabel={s.scoreLabel} />)}
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}
