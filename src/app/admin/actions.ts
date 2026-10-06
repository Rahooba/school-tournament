"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, supabaseServer } from "@/lib/supabase-server";
import { SPORTS, isSport, type SportSlug } from "@/lib/types";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const num = (f: FormData, k: string) => Number(f.get(k) ?? 0);

function sportOf(f: FormData): SportSlug {
  const s = str(f, "sport");
  if (!isSport(s)) throw new Error("رياضة غير معروفة");
  return s;
}

function done(sport: SportSlug, section: string, msg: string, type: "ok" | "err" = "ok"): never {
  revalidatePath(`/${sport}`, "layout");
  revalidatePath("/");
  redirect(`/admin/${sport}/${section}?${type}=${encodeURIComponent(msg)}`);
}

// ---------------- الدخول / الخروج ----------------
export async function login(form: FormData) {
  const sb = await supabaseServer();
  const { error } = await sb.auth.signInWithPassword({ email: str(form, "email"), password: str(form, "password") });
  if (error) redirect("/admin/login?err=" + encodeURIComponent("الإيميل أو كلمة السر غلط"));
  redirect("/admin");
}

export async function logout() {
  const sb = await supabaseServer();
  await sb.auth.signOut();
  redirect("/admin/login");
}

// ---------------- الفرق ----------------
async function uploadImage(sb: Awaited<ReturnType<typeof requireAdmin>>, file: File | null, folder: string) {
  if (!file || file.size === 0) return null;
  if (file.size > 1_500_000) throw new Error("الصورة أكبر من 1.5MB");
  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  if (!["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) throw new Error("نوع الصورة غير مدعوم");
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await sb.storage.from("logos").upload(path, file, { contentType: file.type });
  if (error) throw error;
  return sb.storage.from("logos").getPublicUrl(path).data.publicUrl;
}

export async function addTeam(form: FormData) {
  const sport = sportOf(form);
  try {
    const sb = await requireAdmin();
    const name = str(form, "name");
    if (!name) throw new Error("اكتب اسم الفريق");
    const logo = await uploadImage(sb, form.get("logo") as File | null, "teams");
    const { error } = await sb.from("teams").insert({ sport, name, logo_url: logo });
    if (error) throw new Error(error.code === "23505" ? "الفريق ده موجود قبل كده" : error.message);
  } catch (e) {
    done(sport, "teams", (e as Error).message, "err");
  }
  done(sport, "teams", "تمت إضافة الفريق");
}

export async function deleteTeam(form: FormData) {
  const sport = sportOf(form);
  const sb = await requireAdmin();
  const { error } = await sb.from("teams").delete().eq("id", num(form, "id"));
  done(sport, "teams", error ? error.message : "تم حذف الفريق", error ? "err" : "ok");
}

// ---------------- المباريات ----------------
export async function generateFixtures(form: FormData) {
  const sport = sportOf(form);
  try {
    const sb = await requireAdmin();
    const start = new Date(str(form, "start"));
    const gap = Math.max(10, num(form, "gap"));
    if (isNaN(start.getTime())) throw new Error("حدد تاريخ البداية");

    const [{ data: teams }, { data: existing }] = await Promise.all([
      sb.from("teams").select("id").eq("sport", sport).order("id"),
      sb.from("matches").select("team1_id,team2_id").eq("sport", sport).eq("stage", "league"),
    ]);
    if (!teams || teams.length < 2) throw new Error("لازم فريقين على الأقل");

    const have = new Set((existing ?? []).map((m) => [m.team1_id, m.team2_id].sort().join("-")));
    const rows: object[] = [];
    let t = start.getTime();
    for (let i = 0; i < teams.length; i++)
      for (let j = i + 1; j < teams.length; j++) {
        if (have.has([teams[i].id, teams[j].id].sort().join("-"))) continue;
        rows.push({ sport, team1_id: teams[i].id, team2_id: teams[j].id, match_date: new Date(t).toISOString(), stage: "league", status: "scheduled" });
        t += gap * 60_000;
      }
    if (!rows.length) throw new Error("كل المباريات متعملة بالفعل");
    const { error } = await sb.from("matches").insert(rows);
    if (error) throw error;
    done(sport, "matches", `تم إنشاء ${rows.length} مباراة`);
  } catch (e) {
    if ((e as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw e;
    done(sport, "matches", (e as Error).message, "err");
  }
}

export async function saveResult(form: FormData) {
  const sport = sportOf(form);
  const sb = await requireAdmin();
  const s1 = num(form, "s1"), s2 = num(form, "s2");
  if (!SPORTS[sport].allowDraw && s1 === s2) done(sport, "matches", "الطايرة مفيهاش تعادل — لازم فايز", "err");
  const { error } = await sb.from("matches")
    .update({ team1_score: s1, team2_score: s2, status: "completed" }).eq("id", num(form, "id"));
  done(sport, "matches", error ? error.message : "تم حفظ النتيجة", error ? "err" : "ok");
}

export async function deleteMatch(form: FormData) {
  const sport = sportOf(form);
  const sb = await requireAdmin();
  const { error } = await sb.from("matches").delete().eq("id", num(form, "id"));
  done(sport, "matches", error ? error.message : "تم حذف المباراة", error ? "err" : "ok");
}

export async function createFinal(form: FormData) {
  const sport = sportOf(form);
  const sb = await requireAdmin();
  const date = new Date(str(form, "date"));
  if (isNaN(date.getTime())) done(sport, "matches", "حدد موعد النهائي", "err");

  const { data: top } = await sb.from("standings").select("team_id").eq("sport", sport)
    .order("points", { ascending: false }).order("gd", { ascending: false }).order("gf", { ascending: false }).limit(4);
  if (!top || top.length < 2) done(sport, "matches", "محتاج فريقين على الأقل", "err");

  await sb.from("matches").delete().eq("sport", sport).eq("stage", "final").eq("status", "scheduled");
  const { error } = await sb.from("matches").insert({
    sport, team1_id: top![0].team_id, team2_id: top![1].team_id, match_date: date.toISOString(), stage: "final",
  });
  done(sport, "matches", error ? error.message : "تم تحديد النهائي بين أول فريقين", error ? "err" : "ok");
}

// ---------------- اللاعبين ----------------
export async function addPlayer(form: FormData) {
  const sport = sportOf(form);
  try {
    const sb = await requireAdmin();
    const name = str(form, "name");
    if (!name) throw new Error("اكتب اسم اللاعب");
    const photo = await uploadImage(sb, form.get("photo") as File | null, "players");
    const no = str(form, "shirt_no");
    const { error } = await sb.from("players").insert({
      team_id: num(form, "team_id"), name, shirt_no: no === "" ? null : Number(no),
      position: str(form, "position") || null, photo_url: photo,
    });
    if (error) throw error;
  } catch (e) {
    done(sport, "players", (e as Error).message, "err");
  }
  done(sport, "players", "تمت إضافة اللاعب");
}

export async function deletePlayer(form: FormData) {
  const sport = sportOf(form);
  const sb = await requireAdmin();
  const { error } = await sb.from("players").delete().eq("id", num(form, "id"));
  done(sport, "players", error ? error.message : "تم حذف اللاعب", error ? "err" : "ok");
}

export async function setBestPlayer(form: FormData) {
  const sport = sportOf(form);
  const sb = await requireAdmin();
  const pid = str(form, "player_id");
  const { error } = await sb.from("best_player").upsert({
    sport, player_id: pid ? Number(pid) : null, note: str(form, "note") || null, updated_at: new Date().toISOString(),
  });
  done(sport, "players", error ? error.message : "تم اختيار أفضل لاعب ⭐", error ? "err" : "ok");
}

// ---------------- إحصائيات اللاعبين في مباراة ----------------
export async function saveMatchStats(form: FormData) {
  const sport = sportOf(form);
  const sb = await requireAdmin();
  const matchId = num(form, "match_id");
  const rows: { match_id: number; player_id: number; scored: number }[] = [];
  for (const [k, v] of form.entries()) {
    if (!k.startsWith("p_")) continue;
    const scored = Number(v) || 0;
    if (scored > 0) rows.push({ match_id: matchId, player_id: Number(k.slice(2)), scored });
  }
  await sb.from("player_stats").delete().eq("match_id", matchId);
  if (rows.length) {
    const { error } = await sb.from("player_stats").insert(rows);
    if (error) done(sport, `matches/${matchId}`, error.message, "err");
  }
  done(sport, `matches/${matchId}`, "تم حفظ إحصائيات اللاعبين");
}
