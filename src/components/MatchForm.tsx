import { STAGE_LABEL, type Match, type SportSlug } from "@/lib/types";
import { toCairoInput } from "@/lib/format";

type TeamOpt = { id: number; name: string };

export function MatchForm({
  action, sport, teams, match, submitLabel, scoreLabel,
}: {
  action: (form: FormData) => Promise<void>;
  sport: SportSlug;
  teams: TeamOpt[];
  match?: Pick<Match, "id" | "team1_id" | "team2_id" | "team1_score" | "team2_score" | "match_date" | "status" | "stage">;
  submitLabel: string;
  scoreLabel: string;
}) {
  const teamSelect = (name: string, value?: number) => (
    <select name={name} required defaultValue={value ?? ""} className="input">
      <option value="" disabled>اختار الفريق</option>
      {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
    </select>
  );

  return (
    // @container: الحقول بتترتب حسب عرض الفورم نفسه (سايد بار ضيق أو صفحة عريضة)
    <form action={action} className="@container group/f space-y-4">
      <input type="hidden" name="sport" value={sport} />
      {match && <input type="hidden" name="id" value={match.id} />}

      <div className="grid gap-3 @md:grid-cols-2">
        <div><label className="label">الفريق الأول</label>{teamSelect("team1_id", match?.team1_id)}</div>
        <div><label className="label">الفريق التاني</label>{teamSelect("team2_id", match?.team2_id)}</div>
      </div>

      <div>
        <label className="label">التاريخ والوقت</label>
        <input name="date" type="datetime-local" required defaultValue={match ? toCairoInput(match.match_date) : ""} className="input" />
      </div>

      <div className="grid gap-3 @md:grid-cols-2">
        <div>
          <label className="label">المرحلة</label>
          <select name="stage" defaultValue={match?.stage ?? "league"} className="input">
            {(Object.keys(STAGE_LABEL) as Match["stage"][]).map((k) => <option key={k} value={k}>{STAGE_LABEL[k]}</option>)}
          </select>
        </div>
        <div>
          <label className="label">حالة المباراة</label>
          <select name="status" defaultValue={match?.status ?? "scheduled"} className="input">
            <option value="scheduled">قادمة</option>
            <option value="completed">انتهت</option>
            <option value="cancelled">ملغية</option>
          </select>
        </div>
      </div>

      {/* النتيجة بتظهر بس لما الحالة تبقى «انتهت» */}
      <div className="hidden rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200 group-has-[option[value=completed]:checked]/f:block">
        <label className="label">النتيجة ({scoreLabel})</label>
        <div className="flex items-center justify-center gap-3" dir="ltr">
          <input name="s1" type="number" min={0} defaultValue={match?.team1_score ?? 0} aria-label={`${scoreLabel} الفريق الأول`} className="input !w-20 text-center text-lg font-extrabold" />
          <span className="font-bold text-slate-400">-</span>
          <input name="s2" type="number" min={0} defaultValue={match?.team2_score ?? 0} aria-label={`${scoreLabel} الفريق التاني`} className="input !w-20 text-center text-lg font-extrabold" />
        </div>
      </div>

      <button className="btn btn-primary w-full">{submitLabel}</button>
    </form>
  );
}
