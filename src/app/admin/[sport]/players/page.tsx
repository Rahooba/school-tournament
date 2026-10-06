import { supabaseServer } from "@/lib/supabase-server";
import { type Player, type SportSlug } from "@/lib/types";
import { Flash } from "@/components/Flash";
import { TeamLogo } from "@/components/TeamBadge";
import { addPlayer, deletePlayer, setBestPlayer } from "../../actions";

export const dynamic = "force-dynamic";

export default async function PlayersAdmin({ params, searchParams }: { params: Promise<{ sport: SportSlug }>; searchParams: Promise<{ ok?: string; err?: string }> }) {
  const { sport } = await params;
  const { ok, err } = await searchParams;
  const sb = await supabaseServer();
  const [{ data: teams }, { data: pl }, { data: best }, { data: scorers }] = await Promise.all([
    sb.from("teams").select("id,name").eq("sport", sport).order("name"),
    sb.from("players").select("id,team_id,name,shirt_no,position,photo_url,teams!inner(name,sport,logo_url)").eq("teams.sport", sport).order("name"),
    sb.from("best_player").select("player_id,note").eq("sport", sport).maybeSingle(),
    sb.from("top_players").select("player_id,total_scored").eq("sport", sport),
  ]);
  const players = (pl ?? []) as unknown as Player[];
  const total = new Map((scorers ?? []).map((x) => [x.player_id, x.total_scored]));

  return (
    <div className="space-y-5">
      <Flash ok={ok} err={err} />

      <form action={addPlayer} className="card grid gap-3 p-4 md:grid-cols-6 md:items-end">
        <input type="hidden" name="sport" value={sport} />
        <div className="md:col-span-2"><label className="label">اسم اللاعب</label><input name="name" required className="input" /></div>
        <div>
          <label className="label">الفريق</label>
          <select name="team_id" required className="input">
            <option value="">اختر</option>
            {(teams ?? []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div><label className="label">رقم القميص</label><input name="shirt_no" type="number" min={0} max={99} className="input" /></div>
        <div><label className="label">المركز</label><input name="position" className="input" placeholder="مهاجم / ليبرو.." /></div>
        <button className="btn btn-primary">إضافة</button>
        <div className="md:col-span-6"><label className="label">صورة (اختياري)</label><input name="photo" type="file" accept="image/*" className="input" /></div>
      </form>

      <form action={setBestPlayer} className="card grid gap-3 border-2 border-amber-300 p-4 md:grid-cols-[2fr_2fr_auto] md:items-end">
        <input type="hidden" name="sport" value={sport} />
        <div>
          <label className="label">⭐ أفضل لاعب</label>
          <select name="player_id" defaultValue={best?.player_id ?? ""} className="input">
            <option value="">— لم يُحدد —</option>
            {players.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.teams?.name}) — {total.get(p.id) ?? 0}</option>)}
          </select>
        </div>
        <div><label className="label">ملاحظة (اختياري)</label><input name="note" defaultValue={best?.note ?? ""} className="input" /></div>
        <button className="btn btn-primary">اعتماد</button>
      </form>

      <div className="card divide-y divide-slate-100">
        {players.length === 0 && <p className="p-5 text-center text-slate-500">لسه ماتضافش لاعبين.</p>}
        {players.map((p) => (
          <div key={p.id} className="flex items-center gap-3 p-3">
            <TeamLogo url={p.photo_url} name={p.name} size={36} />
            <div className="flex-1">
              <div className="font-semibold">{p.name} {best?.player_id === p.id && "⭐"}</div>
              <div className="text-xs text-slate-500">{p.teams?.name} · #{p.shirt_no ?? "–"} · {p.position ?? ""} · {total.get(p.id) ?? 0}</div>
            </div>
            <form action={deletePlayer}>
              <input type="hidden" name="sport" value={sport} /><input type="hidden" name="id" value={p.id} />
              <button className="btn btn-danger">حذف</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
