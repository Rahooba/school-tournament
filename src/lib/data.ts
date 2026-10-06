import { supabasePublic as sb } from "./supabase-public";
import type { Match, Player, SportSlug, Standing, Team, TopPlayer } from "./types";

const MATCH_SELECT =
  "id,sport,team1_id,team2_id,team1_score,team2_score,match_date,status,stage," +
  "team1:teams!matches_team1_id_fkey(name,logo_url),team2:teams!matches_team2_id_fkey(name,logo_url)";

// كل الدوال بتتحمّل بشكل آمن: لو حصل خطأ بترجّع قيمة فاضية بدل ما الصفحة تقع
async function safe<T>(p: PromiseLike<{ data: T | null; error: unknown }>, fallback: T): Promise<T> {
  try {
    const { data, error } = await p;
    if (error) {
      console.error(error);
      return fallback;
    }
    return data ?? fallback;
  } catch (e) {
    console.error(e);
    return fallback;
  }
}

export const getStandings = (sport: SportSlug) =>
  safe<Standing[]>(
    sb.from("standings").select("*").eq("sport", sport)
      .order("points", { ascending: false }).order("gd", { ascending: false }).order("gf", { ascending: false }),
    []
  );

export const getMatches = (sport: SportSlug, opts: { status?: Match["status"]; stage?: Match["stage"]; limit?: number } = {}) => {
  let q = sb.from("matches").select(MATCH_SELECT).eq("sport", sport);
  if (opts.status) q = q.eq("status", opts.status);
  if (opts.stage) q = q.eq("stage", opts.stage);
  q = q.order("match_date", { ascending: opts.status === "scheduled" });
  if (opts.limit) q = q.limit(opts.limit);
  return safe<Match[]>(q as unknown as PromiseLike<{ data: Match[] | null; error: unknown }>, []);
};

export const getTeams = (sport: SportSlug) =>
  safe<Team[]>(sb.from("teams").select("id,sport,name,logo_url").eq("sport", sport).order("name"), []);

export const getPlayers = (sport: SportSlug) =>
  safe<Player[]>(
    sb.from("players").select("id,team_id,name,shirt_no,position,photo_url,teams!inner(name,sport,logo_url)")
      .eq("teams.sport", sport).order("name") as unknown as PromiseLike<{ data: Player[] | null; error: unknown }>,
    []
  );

export const getTopPlayers = (sport: SportSlug, limit = 10) =>
  safe<TopPlayer[]>(
    sb.from("top_players").select("*").eq("sport", sport).gt("total_scored", 0)
      .order("total_scored", { ascending: false }).limit(limit),
    []
  );

export async function getBestPlayer(sport: SportSlug) {
  const rows = await safe<{ note: string | null; players: Player & { teams: { name: string } } | null }[]>(
    sb.from("best_player").select("note,players(id,team_id,name,shirt_no,position,photo_url,teams(name,sport,logo_url))")
      .eq("sport", sport).limit(1) as unknown as PromiseLike<{ data: never[] | null; error: unknown }>,
    []
  );
  return rows[0]?.players ? { player: rows[0].players, note: rows[0].note } : null;
}

export async function getTournamentStatus(sport: SportSlug) {
  const [teams, standings, leagueMatches, finals] = await Promise.all([
    getTeams(sport),
    getStandings(sport),
    getMatches(sport, { stage: "league" }),
    getMatches(sport, { stage: "final" }),
  ]);
  const played = leagueMatches.filter((m) => m.status === "completed").length;
  const total = (teams.length * (teams.length - 1)) / 2; // كل فريق يلاعب الثاني مرة واحدة
  const final = finals[0] ?? null;
  const champion =
    final && final.status === "completed"
      ? final.team1_score > final.team2_score ? final.team1 : final.team2
      : null;
  return { teams, standings, played, total, final, champion, leagueDone: total > 0 && played >= total };
}
