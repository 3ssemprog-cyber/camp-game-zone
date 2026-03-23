-- =============================================
-- Camp Game Zone — Supabase Schema
-- شغّل الكود ده في Supabase → SQL Editor
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  uid TEXT UNIQUE NOT NULL,
  name TEXT,
  email TEXT,
  role TEXT DEFAULT 'موظف',
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employees
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT,
  salary NUMERIC DEFAULT 0,
  draws JSONB DEFAULT '[]',
  advances JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shifts
CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shift_key TEXT UNIQUE,
  day_key TEXT,
  status TEXT DEFAULT 'open',
  opened_by TEXT,
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  day_closed_at TIMESTAMPTZ
);

-- Shift Totals
CREATE TABLE IF NOT EXISTS shift_totals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shift_key TEXT UNIQUE,
  cash NUMERIC DEFAULT 0,
  elec NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Closing
CREATE TABLE IF NOT EXISTS daily_closing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_key TEXT UNIQUE,
  month_key TEXT,
  date TEXT,
  cash NUMERIC DEFAULT 0,
  elec NUMERIC DEFAULT 0,
  total_exp NUMERIC DEFAULT 0,
  closed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Expenses
CREATE TABLE IF NOT EXISTS daily_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cat TEXT,
  amt NUMERIC DEFAULT 0,
  note TEXT,
  time TEXT,
  day_key TEXT,
  date TEXT,
  shift_key TEXT,
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Monthly Expenses
CREATE TABLE IF NOT EXISTS monthly_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cat TEXT,
  amt NUMERIC DEFAULT 0,
  note TEXT,
  month TEXT,
  month_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT DEFAULT 'counted',
  qty NUMERIC DEFAULT 0,
  alert_qty NUMERIC DEFAULT 5,
  unit TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu Orders
CREATE TABLE IF NOT EXISTS menu_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT,
  items JSONB DEFAULT '[]',
  total NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending',
  time TEXT,
  date TEXT,
  accepted_time TEXT,
  done_time TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- POS Sessions
CREATE TABLE IF NOT EXISTS pos_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT,
  sessions JSONB DEFAULT '[]',
  items JSONB DEFAULT '[]',
  cash_amt NUMERIC DEFAULT 0,
  elec_amt NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  shift_key TEXT,
  day_key TEXT,
  date TEXT,
  time TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions Log
CREATE TABLE IF NOT EXISTS transactions_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT,
  detail TEXT,
  section TEXT,
  user_name TEXT,
  role TEXT,
  date TEXT,
  time TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Salary Closing
CREATE TABLE IF NOT EXISTS salary_closing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  emp_name TEXT,
  salary NUMERIC DEFAULT 0,
  draws NUMERIC DEFAULT 0,
  advances NUMERIC DEFAULT 0,
  net NUMERIC DEFAULT 0,
  is_deficit BOOLEAN DEFAULT FALSE,
  month_key TEXT,
  date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu Items
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  price NUMERIC DEFAULT 0,
  category TEXT,
  image_url TEXT,
  available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tables
CREATE TABLE IF NOT EXISTS tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  type TEXT DEFAULT 'ps',
  status TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Row Level Security
-- =============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_totals ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_closing ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_closing ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

DO $$ DECLARE tbl TEXT;
BEGIN FOR tbl IN SELECT unnest(ARRAY[
  'users','employees','shifts','shift_totals','daily_closing',
  'daily_expenses','monthly_expenses','inventory','menu_orders',
  'pos_sessions','transactions_log','salary_closing','menu_items','tables'
]) LOOP
  EXECUTE format('CREATE POLICY "allow_all_%s" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)', tbl, tbl);
END LOOP; END $$;

-- =============================================
-- Timer Cat Items (بدل subcollections)
-- =============================================
CREATE TABLE IF NOT EXISTS timer_cat_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cat_id TEXT NOT NULL,
  name TEXT NOT NULL,
  rate NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE timer_cat_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_timer_cat_items" ON timer_cat_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Menu Settings
CREATE TABLE IF NOT EXISTS menu_settings (
  id TEXT PRIMARY KEY,
  cats JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE menu_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_menu_settings" ON menu_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Returns
CREATE TABLE IF NOT EXISTS returns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  items JSONB DEFAULT '[]',
  total NUMERIC DEFAULT 0,
  date TEXT,
  day_key TEXT,
  time TEXT,
  cashier TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_returns" ON returns FOR ALL TO authenticated USING (true) WITH CHECK (true);
