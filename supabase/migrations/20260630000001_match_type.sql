-- ============================================================
-- Migration: support match_type (liga / entreno)
-- ============================================================

-- 1. New enum
create type match_type as enum ('liga', 'entreno');

-- 2. Add column — default 'liga' so all existing rows stay valid
alter table matches
  add column match_type match_type not null default 'liga';

-- 3. Make opponent and home_away nullable
--    (entreno has no external rival or home/away concept)
alter table matches
  alter column opponent drop not null;

alter table matches
  alter column home_away drop not null;

-- 4. Drop the hard limit of 3 pairs from match_sets
--    (entreno sessions can have any number of pairs)
do $$
declare
  v_constraint text;
begin
  select conname into v_constraint
  from pg_constraint
  where conrelid = 'match_sets'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%pair_number%';
  if v_constraint is not null then
    execute format('alter table match_sets drop constraint %I', v_constraint);
  end if;
end $$;

-- Re-add a minimal sanity constraint: pair_number must be >= 1
alter table match_sets
  add constraint match_sets_pair_number_positive check (pair_number >= 1);
