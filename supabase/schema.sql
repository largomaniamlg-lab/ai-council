-- Schema SQL para AI Council (Supabase / Postgres)
-- Ejecutar en el SQL editor de Supabase o via `supabase db push`.

create extension if not exists "uuid-ossp";

create table if not exists projects (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  problem text not null,
  mode text not null check (mode in ('rapido', 'completo', 'debate', 'experto')),
  locale text,
  discovery_history jsonb not null default '[]',
  source text not null default 'real' check (source in ('real', 'mock')),
  created_at timestamptz not null default now()
);

create table if not exists agent_responses (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references sessions(id) on delete cascade,
  role text not null,
  model_provider text not null,
  model_name text not null,
  round int not null default 1,
  prompt text not null,
  response text,
  error text,
  confidence numeric,
  stance text check (stance in ('maintain', 'revise')),
  created_at timestamptz not null default now()
);

create table if not exists council_minutes (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references sessions(id) on delete cascade,
  round int not null default 1,
  is_moderator_only boolean not null default false,
  summary text,
  agreements jsonb not null default '[]',
  disagreements jsonb not null default '[]',
  risks jsonb not null default '[]',
  open_questions jsonb not null default '[]',
  recommendation text,
  verdict text check (verdict in ('maintained', 'revised', 'mixed')),
  convergence_note text,
  markdown text,
  created_at timestamptz not null default now()
);

-- Migracion v0.4 (Deliberative Council): si ya tenias el schema creado antes
-- de estas columnas, ejecuta este bloque para anadirlas sin perder datos.
alter table agent_responses add column if not exists stance text check (stance in ('maintain', 'revise'));
alter table council_minutes add column if not exists round int not null default 1;
alter table council_minutes add column if not exists is_moderator_only boolean not null default false;
alter table council_minutes add column if not exists verdict text check (verdict in ('maintained', 'revised', 'mixed'));
alter table council_minutes add column if not exists convergence_note text;

-- Migracion v0.5.1 (Session History): idem, anade estas columnas si el
-- schema ya existia sin ellas.
alter table sessions add column if not exists locale text;
alter table sessions add column if not exists discovery_history jsonb not null default '[]';

-- Migracion v0.5.3 (Mock AI): idem.
alter table sessions add column if not exists source text not null default 'real' check (source in ('real', 'mock'));

create table if not exists president_decisions (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references sessions(id) on delete cascade,
  final_decision text not null,
  rationale text,
  expected_result text,
  created_at timestamptz not null default now()
);

create table if not exists outcomes (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references sessions(id) on delete cascade,
  actual_result text,
  what_worked text,
  what_failed text,
  lessons text,
  created_at timestamptz not null default now()
);

create table if not exists settings (
  id uuid primary key default uuid_generate_v4(),
  provider text not null,
  api_key_reference text,
  enabled_models jsonb not null default '[]',
  default_mode text not null default 'rapido'
);

create index if not exists idx_sessions_project_id on sessions(project_id);
create index if not exists idx_agent_responses_session_id on agent_responses(session_id);
create index if not exists idx_council_minutes_session_id on council_minutes(session_id);
create index if not exists idx_president_decisions_session_id on president_decisions(session_id);
create index if not exists idx_outcomes_session_id on outcomes(session_id);

-- MVP personal: Row Level Security desactivado por simplicidad (un solo
-- usuario). Si se despliega para varios usuarios, activar RLS y anadir
-- politicas por user_id.
