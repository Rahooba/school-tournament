export type SportSlug = "football" | "volleyball";

export const SPORTS: Record<
  SportSlug,
  { slug: SportSlug; name: string; icon: string; scoreLabel: string; allowDraw: boolean; accent: string }
> = {
  football: { slug: "football", name: "كرة القدم", icon: "⚽", scoreLabel: "أهداف", allowDraw: true, accent: "#16a34a" },
  volleyball: { slug: "volleyball", name: "الكرة الطائرة", icon: "🏐", scoreLabel: "أشواط", allowDraw: false, accent: "#ea580c" },
};

export function isSport(s: string): s is SportSlug {
  return s === "football" || s === "volleyball";
}

export type Team = { id: number; sport: SportSlug; name: string; logo_url: string | null };

export type Standing = {
  sport: SportSlug;
  team_id: number;
  name: string;
  logo_url: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
};

export type Match = {
  id: number;
  sport: SportSlug;
  team1_id: number;
  team2_id: number;
  team1_score: number;
  team2_score: number;
  match_date: string;
  status: "scheduled" | "completed" | "cancelled";
  stage: "league" | "third_place" | "final";
  team1: { name: string; logo_url: string | null } | null;
  team2: { name: string; logo_url: string | null } | null;
};

export type Player = {
  id: number;
  team_id: number;
  name: string;
  shirt_no: number | null;
  position: string | null;
  photo_url: string | null;
  teams?: { name: string; sport: SportSlug; logo_url: string | null } | null;
};

export type TopPlayer = {
  player_id: number;
  name: string;
  shirt_no: number | null;
  photo_url: string | null;
  team_id: number;
  team_name: string;
  sport: SportSlug;
  total_scored: number;
};

export const STAGE_LABEL: Record<Match["stage"], string> = {
  league: "الدوري",
  third_place: "المركز الثالث",
  final: "النهائي",
};
