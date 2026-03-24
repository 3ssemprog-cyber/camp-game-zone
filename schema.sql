-- ============================================================
--  Camp Game Zone — Supabase SQL Schema
--  روح Supabase → SQL Editor → New Query → الصق وشغّل
-- ============================================================

create extension if not exists "uuid-ossp";

-- ─── users ───────────────────────────────────────────────────
create table if not exists users (
  id          uuid primary key default uuid_generate_v4(),
  uid         text unique not null,
  name        text,
  email       text,
  role        text default 'موظف',
  permissions jsonb default '{}',
  days        int default 0,
  salary      numeric(10,2) default 0,
  draws       jsonb default '[]',
  created_at  timestamptz default now()
);

-- ─── tables ──────────────────────────────────────────────────
create table if not exists tables (
  id          text primary key,
  name        text,
  cat_type    text default '',
  busy        boolean default false,
  open_at     bigint default null,
  order_items jsonb default '[]',
  sessions    jsonb default '[]',
  created_at  timestamptz default now()
);

-- ─── menu_items ──────────────────────────────────────────────
create table if not exists menu_items (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  price       numeric(10,2) default 0,
  cat         text,
  img         text,
  description text,
  available   boolean default true,
  created_at  timestamptz default now()
);

-- ─── menu_orders ─────────────────────────────────────────────
create table if not exists menu_orders (
  id            uuid primary key default uuid_generate_v4(),
  table_name    text,
  items         jsonb default '[]',
  total         numeric(10,2) default 0,
  status        text default 'pending',
  date          text,
  time          text,
  accepted_time text,
  done_time     text,
  created_at    timestamptz default now()
);

-- ─── menu_settings ───────────────────────────────────────────
create table if not exists menu_settings (
  id   text primary key,
  cats jsonb default '[]',
  data jsonb default '{}'
);

-- ─── pos_sessions ────────────────────────────────────────────
create table if not exists pos_sessions (
  id             uuid primary key default uuid_generate_v4(),
  table_name     text,
  items          jsonb default '[]',
  sessions       jsonb default '[]',
  total          numeric(10,2) default 0,
  original_total numeric(10,2) default 0,
  discount_amt   numeric(10,2) default 0,
  pay_method     text,
  cash_amt       numeric(10,2) default 0,
  elec_amt       numeric(10,2) default 0,
  shift_key      text,
  day_key        text,
  date           text,
  time           text,
  cashier        text,
  created_at     timestamptz default now()
);

-- ─── shifts ──────────────────────────────────────────────────
create table if not exists shifts (
  id           uuid primary key default uuid_generate_v4(),
  type         text,
  status       text default 'open',
  day_key      text,
  shift_key    text unique,
  start_time   text,
  start_date   text,
  end_time     text,
  end_date     text,
  cash         numeric(10,2) default 0,
  elec         numeric(10,2) default 0,
  total_income numeric(10,2) default 0,
  total_exp    numeric(10,2) default 0,
  net_shift    numeric(10,2) default 0,
  actual_cash  numeric(10,2) default 0,
  cash_diff    numeric(10,2) default 0,
  closed_by    text,
  day_closed_at text,
  created_at   timestamptz default now()
);

-- ─── shift_totals ────────────────────────────────────────────
create table if not exists shift_totals (
  id         text primary key,
  cash       numeric(10,2) default 0,
  elec       numeric(10,2) default 0,
  total      numeric(10,2) default 0,
  shift_key  text,
  day_key    text,
  date       text,
  archived   boolean default false,
  created_at timestamptz default now()
);

-- ─── daily_closing ───────────────────────────────────────────
create table if not exists daily_closing (
  id           text primary key,
  date         text,
  day_key      text unique,
  month_key    text,
  cash         numeric(10,2) default 0,
  elec         numeric(10,2) default 0,
  total_income numeric(10,2) default 0,
  total_exp    numeric(10,2) default 0,
  net_day      numeric(10,2) default 0,
  shifts       jsonb default '[]',
  closed_by    text,
  closed_at    text,
  created_at   timestamptz default now()
);

-- ─── daily_expenses ──────────────────────────────────────────
create table if not exists daily_expenses (
  id         uuid primary key default uuid_generate_v4(),
  cat        text,
  amt        numeric(10,2) default 0,
  note       text,
  time       text,
  day_key    text,
  date       text,
  shift_key  text,
  archived   boolean default false,
  created_at timestamptz default now()
);

-- ─── monthly_expenses ────────────────────────────────────────
create table if not exists monthly_expenses (
  id         uuid primary key default uuid_generate_v4(),
  cat        text,
  amt        numeric(10,2) default 0,
  note       text,
  month      text,
  month_key  text,
  created_at timestamptz default now()
);

-- ─── employees ───────────────────────────────────────────────
create table if not exists employees (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  role       text,
  salary     numeric(10,2) default 0,
  days       int default 0,
  draws      jsonb default '[]',
  created_at timestamptz default now()
);

-- ─── salary_closing ──────────────────────────────────────────
create table if not exists salary_closing (
  id          uuid primary key default uuid_generate_v4(),
  emp_name    text,
  emp_id      text,
  salary      numeric(10,2) default 0,
  days        int default 0,
  draws       numeric(10,2) default 0,
  net         numeric(10,2) default 0,
  is_deficit  boolean default false,
  month_key   text,
  date        text,
  created_at  timestamptz default now()
);

-- ─── inventory ───────────────────────────────────────────────
create table if not exists inventory (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  cat        text,
  qty_type   text default 'limited',
  qty        numeric(10,3) default 0,
  unit       text,
  alert_qty  numeric(10,3) default 0,
  updated_at timestamptz,
  created_at timestamptz default now()
);

-- ─── returns ─────────────────────────────────────────────────
create table if not exists returns (
  id         uuid primary key default uuid_generate_v4(),
  table_name text,
  items      jsonb default '[]',
  total      numeric(10,2) default 0,
  shift_key  text,
  day_key    text,
  date       text,
  time       text,
  created_at timestamptz default now()
);

-- ─── transactions_log ────────────────────────────────────────
create table if not exists transactions_log (
  id         uuid primary key default uuid_generate_v4(),
  action     text,
  detail     text,
  section    text,
  user_name  text,
  role       text,
  date       text,
  time       text,
  created_at timestamptz default now()
);

-- ─── timer_cats ──────────────────────────────────────────────
create table if not exists timer_cats (
  id         uuid primary key default uuid_generate_v4(),
  name       text,
  label      text,
  rate       numeric(10,2) default 0,
  parent_id  uuid default null,
  created_at timestamptz default now()
);

-- ─── settings ────────────────────────────────────────────────
create table if not exists settings (
  id   text primary key,
  data jsonb default '{}'
);

-- ============================================================
--  Row Level Security
-- ============================================================

do $$ declare
  t text;
  tables text[] := array[
    'users','tables','menu_items','menu_orders','menu_settings',
    'pos_sessions','shifts','shift_totals','daily_closing',
    'daily_expenses','monthly_expenses','employees','salary_closing',
    'inventory','returns','transactions_log','timer_cats','settings'
  ];
begin
  foreach t in array tables loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy if not exists "auth_access" on %I for all using (auth.role() = ''authenticated'')', t
    );
  end loop;
end $$;

-- ============================================================
--  Realtime — فعّله من Dashboard
--  Database → Replication → فعّل على: menu_orders, tables
-- ============================================================
