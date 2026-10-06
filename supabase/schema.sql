-- ---------- الرياضات (كورة + طايرة) ----------
create table if not exists public.sports (
  slug          text primary key,            -- 'football' | 'volleyball'
  name_ar       text not null,
  win_points    int  not null default 3,
  draw_points   int  not null default 1,     -- الطايرة: مفيش تعادل فمش بيتستخدم
  loss_points   int  not null default 0,
  allow_draw    boolean not null default true,
  score_label   text not null                -- "أهداف" / "نقاط"
);

insert into public.sports (slug, name_ar, win_points, draw_points, loss_points, allow_draw, score_label) values
  ('football',   'كرة القدم', 3, 1, 0, true,  'أهداف'),
  ('volleyball', 'الكرة الطائرة', 3, 0, 0, false, 'أشواط')
on conflict (slug) do nothing;

-- ---------- الفرق ----------
create table if not exists public.teams (
  id          bigint generated always as identity primary key,
  sport       text not null references public.sports(slug) on delete cascade,
  name        text not null,
  logo_url    text,
  created_at  timestamptz not null default now(),
  unique (sport, name)
);
create index if not exists teams_sport_idx on public.teams (sport);

-- ---------- المباريات ----------
create table if not exists public.matches (
  id           bigint generated always as identity primary key,
  sport        text not null references public.sports(slug) on delete cascade,
  team1_id     bigint not null references public.teams(id) on delete cascade,
  team2_id     bigint not null references public.teams(id) on delete cascade,
  team1_score  int not null default 0 check (team1_score >= 0),
  team2_score  int not null default 0 check (team2_score >= 0),
  match_date   timestamptz not null,
  status       text not null default 'scheduled' check (status in ('scheduled','completed','cancelled')),
  stage        text not null default 'league'    check (stage in ('league','third_place','final')),
  created_at   timestamptz not null default now(),
  check (team1_id <> team2_id),
  -- الطايرة: ممنوع التعادل في أي مباراة منتهية
  check (sport <> 'volleyball' or status <> 'completed' or team1_score <> team2_score)
);
create index if not exists matches_sport_stage_idx on public.matches (sport, stage, status);
create index if not exists matches_date_idx        on public.matches (sport, match_date desc);
create index if not exists matches_team1_idx       on public.matches (team1_id);
create index if not exists matches_team2_idx       on public.matches (team2_id);

-- ---------- اللاعبين (الجدول الجديد) ----------
create table if not exists public.players (
  id          bigint generated always as identity primary key,
  team_id     bigint not null references public.teams(id) on delete cascade,
  name        text not null,
  shirt_no    int check (shirt_no between 0 and 99),
  position    text,
  photo_url   text,
  created_at  timestamptz not null default now()
);
create index if not exists players_team_idx on public.players (team_id);

-- ---------- إحصائيات اللاعب في كل مباراة (أهداف / نقاط) ----------
create table if not exists public.player_stats (
  id         bigint generated always as identity primary key,
  match_id   bigint not null references public.matches(id) on delete cascade,
  player_id  bigint not null references public.players(id) on delete cascade,
  scored     int not null default 0 check (scored >= 0),
  unique (match_id, player_id)
);
create index if not exists player_stats_player_idx on public.player_stats (player_id);

-- ---------- أفضل لاعب (يختاره المنظّم لكل رياضة) ----------
create table if not exists public.best_player (
  sport      text primary key references public.sports(slug) on delete cascade,
  player_id  bigint references public.players(id) on delete set null,
  note       text,
  updated_at timestamptz not null default now()
);
insert into public.best_player (sport) values ('football'), ('volleyball') on conflict do nothing;

-- ---------- الترتيب: بيتحسب من المباريات مباشرة (مفيش عدادات يدوية تتلخبط) ----------
create or replace view public.standings
with (security_invoker = on) as
with sides as (
  select m.sport, m.team1_id as team_id, m.team1_score as gf, m.team2_score as ga
    from public.matches m where m.status = 'completed' and m.stage = 'league'
  union all
  select m.sport, m.team2_id, m.team2_score, m.team1_score
    from public.matches m where m.status = 'completed' and m.stage = 'league'
)
select
  t.sport,
  t.id   as team_id,
  t.name,
  t.logo_url,
  count(s.team_id)                                             as played,
  count(*) filter (where s.gf >  s.ga)                         as won,
  count(*) filter (where s.gf =  s.ga)                         as drawn,
  count(*) filter (where s.gf <  s.ga)                         as lost,
  coalesce(sum(s.gf), 0)                                       as gf,
  coalesce(sum(s.ga), 0)                                       as ga,
  coalesce(sum(s.gf), 0) - coalesce(sum(s.ga), 0)              as gd,
  (count(*) filter (where s.gf >  s.ga)) * sp.win_points
  + (count(*) filter (where s.gf =  s.ga)) * sp.draw_points
  + (count(*) filter (where s.gf <  s.ga)) * sp.loss_points    as points
from public.teams t
join public.sports sp on sp.slug = t.sport
left join sides s on s.team_id = t.id and s.sport = t.sport
group by t.sport, t.id, t.name, t.logo_url, sp.win_points, sp.draw_points, sp.loss_points;

-- ---------- ترتيب الهدّافين ----------
create or replace view public.top_players
with (security_invoker = on) as
select
  p.id as player_id, p.name, p.shirt_no, p.photo_url,
  t.id as team_id, t.name as team_name, t.sport,
  coalesce(sum(ps.scored), 0)::int as total_scored,
  count(ps.id)::int as matches_with_stats
from public.players p
join public.teams t on t.id = p.team_id
left join public.player_stats ps on ps.player_id = p.id
group by p.id, p.name, p.shirt_no, p.photo_url, t.id, t.name, t.sport;

-- ======================= الصلاحيات (RLS) =======================
-- القراءة للكل، والكتابة للمسؤول (مستخدم مسجّل دخول) فقط.
alter table public.sports        enable row level security;
alter table public.teams         enable row level security;
alter table public.matches       enable row level security;
alter table public.players       enable row level security;
alter table public.player_stats  enable row level security;
alter table public.best_player   enable row level security;

do $$
declare t text;
begin
  foreach t in array array['sports','teams','matches','players','player_stats','best_player'] loop
    execute format('drop policy if exists "public read" on public.%I', t);
    execute format('create policy "public read" on public.%I for select using (true)', t);
    execute format('drop policy if exists "admin write" on public.%I', t);
    execute format('create policy "admin write" on public.%I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- ======================= التخزين (لوجوهات الفرق وصور اللاعبين) =======================
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

drop policy if exists "logos public read"  on storage.objects;
drop policy if exists "logos admin write"  on storage.objects;
create policy "logos public read" on storage.objects for select using (bucket_id = 'logos');
create policy "logos admin write" on storage.objects for all to authenticated
  using (bucket_id = 'logos') with check (bucket_id = 'logos');
