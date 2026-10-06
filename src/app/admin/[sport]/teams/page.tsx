import { supabaseServer } from "@/lib/supabase-server";
import type { SportSlug, Team } from "@/lib/types";
import { Flash } from "@/components/Flash";
import { TeamBadge } from "@/components/TeamBadge";
import { addTeam, deleteTeam } from "../../actions";

export const dynamic = "force-dynamic";

export default async function TeamsAdmin({ params, searchParams }: { params: Promise<{ sport: SportSlug }>; searchParams: Promise<{ ok?: string; err?: string }> }) {
  const { sport } = await params;
  const { ok, err } = await searchParams;
  const sb = await supabaseServer();
  const { data } = await sb.from("teams").select("id,sport,name,logo_url").eq("sport", sport).order("name");
  const teams = (data ?? []) as Team[];
  return (
    <div className="space-y-5">
      <Flash ok={ok} err={err} />
      <form action={addTeam} className="card grid gap-3 p-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <input type="hidden" name="sport" value={sport} />
        <div><label className="label">اسم الفريق (الفصل)</label><input name="name" required className="input" placeholder="مثال: 3/أ" /></div>
        <div><label className="label">الشعار (اختياري - أقل من 1.5MB)</label><input name="logo" type="file" accept="image/*" className="input" /></div>
        <button className="btn btn-primary">إضافة</button>
      </form>
      <div className="card divide-y divide-slate-100">
        {teams.length === 0 && <p className="p-5 text-center text-slate-500">لسه ماتضافش فرق.</p>}
        {teams.map((t) => (
          <div key={t.id} className="flex items-center justify-between p-3">
            <TeamBadge name={t.name} logo={t.logo_url} size={40} />
            <form action={deleteTeam}>
              <input type="hidden" name="sport" value={sport} /><input type="hidden" name="id" value={t.id} />
              <button className="btn btn-danger">حذف</button>
            </form>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500">حذف فريق بيحذف مبارياته ولاعبيه. الترتيب بيتحسب تلقائي من المباريات.</p>
    </div>
  );
}
