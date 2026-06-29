-- ============================================================
-- Initial schema – Equipo Pádel LAPI
-- ============================================================

-- Enum types
create type player_position  as enum ('drive', 'reves', 'ambos');
create type player_status    as enum ('activo', 'baja');
create type fee_status       as enum ('pendiente', 'pagado');
create type payment_method   as enum ('efectivo', 'bizum', 'transferencia', 'otro');
create type transaction_type as enum ('ingreso', 'gasto');
create type withdrawal_scope as enum ('equipo', 'partido');
create type home_away        as enum ('local', 'visitante');
create type match_status     as enum ('programado', 'jugado', 'aplazado');

-- ------------------------------------------------------------
-- Tables
-- ------------------------------------------------------------

create table players (
  id          uuid         primary key default gen_random_uuid(),
  full_name   text         not null,
  phone       text,
  email       text,
  position    player_position,
  level       text,
  status      player_status not null default 'activo',
  joined_at   date          not null,
  notes       text,
  created_at  timestamptz  not null default now()
);

-- matches before player_fees/withdrawals so FKs resolve
create table matches (
  id              uuid         primary key default gen_random_uuid(),
  date            date         not null,
  opponent        text         not null,
  location        text,
  home_away       home_away    not null,
  result_summary  text,
  status          match_status not null default 'programado',
  notes           text,
  created_at      timestamptz  not null default now()
);

create table player_fees (
  id              uuid           primary key default gen_random_uuid(),
  player_id       uuid           not null references players(id) on delete cascade,
  concept         text           not null,
  amount          numeric(10,2)  not null check (amount > 0),
  status          fee_status     not null default 'pendiente',
  paid_at         date,
  payment_method  payment_method,
  due_date        date,
  created_at      timestamptz    not null default now()
);

create table team_transactions (
  id                 uuid             primary key default gen_random_uuid(),
  type               transaction_type not null,
  concept            text             not null,
  amount             numeric(10,2)    not null check (amount > 0),
  date               date             not null,
  related_player_id  uuid             references players(id) on delete set null,
  related_fee_id     uuid             references player_fees(id) on delete set null,
  created_at         timestamptz      not null default now()
);

create table withdrawals (
  id          uuid             primary key default gen_random_uuid(),
  player_id   uuid             not null references players(id) on delete cascade,
  scope       withdrawal_scope not null,
  match_id    uuid             references matches(id) on delete set null,
  reason      text,
  date        date             not null,
  created_at  timestamptz      not null default now()
);

create table match_sets (
  id           uuid    primary key default gen_random_uuid(),
  match_id     uuid    not null references matches(id) on delete cascade,
  pair_number  int     not null check (pair_number between 1 and 3),
  player_ids   uuid[]  not null,
  sets_won     int     not null default 0,
  sets_lost    int     not null default 0,
  won          boolean not null
);

-- ------------------------------------------------------------
-- Indexes
-- ------------------------------------------------------------

create index idx_player_fees_player_id          on player_fees(player_id);
create index idx_player_fees_status             on player_fees(status);
create index idx_team_transactions_date         on team_transactions(date);
create index idx_team_transactions_related_fee  on team_transactions(related_fee_id);
create index idx_withdrawals_player_id          on withdrawals(player_id);
create index idx_match_sets_match_id            on match_sets(match_id);

-- ------------------------------------------------------------
-- Trigger 1: player_fee pagado → ingreso en team_transactions
-- ------------------------------------------------------------

create or replace function fn_fee_paid_insert_transaction()
returns trigger
language plpgsql
security definer
as $$
declare
  v_player_name text;
begin
  -- Only fires when status flips TO 'pagado'
  if (tg_op = 'UPDATE' and old.status <> 'pagado' and new.status = 'pagado') then
    select full_name into v_player_name from players where id = new.player_id;

    insert into team_transactions (type, concept, amount, date, related_player_id, related_fee_id)
    values (
      'ingreso',
      new.concept || ' – ' || coalesce(v_player_name, ''),
      new.amount,
      coalesce(new.paid_at, current_date),
      new.player_id,
      new.id
    );
  end if;
  return new;
end;
$$;

create trigger trg_fee_paid_insert_transaction
  after update on player_fees
  for each row
  execute function fn_fee_paid_insert_transaction();

-- ------------------------------------------------------------
-- Trigger 2: withdrawal scope='equipo' → players.status='baja'
-- ------------------------------------------------------------

create or replace function fn_withdrawal_equipo_set_baja()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.scope = 'equipo' then
    update players set status = 'baja' where id = new.player_id;
  end if;
  return new;
end;
$$;

create trigger trg_withdrawal_equipo_set_baja
  after insert on withdrawals
  for each row
  execute function fn_withdrawal_equipo_set_baja();

-- ------------------------------------------------------------
-- Row-Level Security
-- ------------------------------------------------------------

alter table players           enable row level security;
alter table player_fees       enable row level security;
alter table team_transactions enable row level security;
alter table withdrawals       enable row level security;
alter table matches           enable row level security;
alter table match_sets        enable row level security;

-- Single policy per table: authenticated user can read and write everything.
-- No multi-tenant, no per-user isolation needed.

create policy "authenticated_all" on players
  for all to authenticated using (true) with check (true);

create policy "authenticated_all" on player_fees
  for all to authenticated using (true) with check (true);

create policy "authenticated_all" on team_transactions
  for all to authenticated using (true) with check (true);

create policy "authenticated_all" on withdrawals
  for all to authenticated using (true) with check (true);

create policy "authenticated_all" on matches
  for all to authenticated using (true) with check (true);

create policy "authenticated_all" on match_sets
  for all to authenticated using (true) with check (true);
