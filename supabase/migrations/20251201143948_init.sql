-- Initial database schema migration for Supabase
-- Run this SQL in your Supabase SQL Editor or via Supabase CLI

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Developers table
CREATE TABLE IF NOT EXISTS developers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  user_id TEXT,
  created_at TEXT NOT NULL
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  primary_contact_user_id TEXT,
  created_at TEXT NOT NULL
);

-- Engagements table
CREATE TABLE IF NOT EXISTS engagements (
  id TEXT PRIMARY KEY,
  developer_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT,
  currency TEXT NOT NULL,
  price_per_period REAL NOT NULL,
  salary_per_period REAL NOT NULL,
  client_dayoff_rate REAL NOT NULL,
  dev_dayoff_rate REAL NOT NULL,
  period_unit TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

-- Day off requests table
CREATE TABLE IF NOT EXISTS day_off_requests (
  id TEXT PRIMARY KEY,
  engagement_id TEXT NOT NULL,
  developer_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  days INTEGER NOT NULL,
  type TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL,
  submitted_by TEXT,
  reviewed_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Holiday credits table
CREATE TABLE IF NOT EXISTS holiday_credits (
  id TEXT PRIMARY KEY,
  engagement_id TEXT NOT NULL,
  date TEXT NOT NULL,
  credit_days INTEGER NOT NULL,
  note TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL
);

-- Holidays table
CREATE TABLE IF NOT EXISTS holidays (
  id TEXT PRIMARY KEY,
  engagement_id TEXT NOT NULL,
  date TEXT NOT NULL,
  name TEXT NOT NULL,
  is_taken INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

-- Invoices table - stores snapshots of monthly financials
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  engagement_id TEXT NOT NULL,
  month TEXT NOT NULL,
  approved_days INTEGER NOT NULL,
  credit_days INTEGER NOT NULL,
  billable_deduction_days INTEGER NOT NULL,
  section2_client_invoice REAL NOT NULL,
  section3_dev_pay REAL NOT NULL,
  section1_company_net REAL NOT NULL,
  price_per_period REAL NOT NULL,
  salary_per_period REAL NOT NULL,
  client_dayoff_rate REAL NOT NULL,
  dev_dayoff_rate REAL NOT NULL,
  period_unit TEXT NOT NULL,
  currency TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(engagement_id, month)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_engagements_developer_id ON engagements(developer_id);
CREATE INDEX IF NOT EXISTS idx_engagements_client_id ON engagements(client_id);
CREATE INDEX IF NOT EXISTS idx_day_off_requests_engagement_id ON day_off_requests(engagement_id);
CREATE INDEX IF NOT EXISTS idx_holiday_credits_engagement_id ON holiday_credits(engagement_id);
CREATE INDEX IF NOT EXISTS idx_holidays_engagement_id ON holidays(engagement_id);
CREATE INDEX IF NOT EXISTS idx_invoices_engagement_id ON invoices(engagement_id);
CREATE INDEX IF NOT EXISTS idx_invoices_month ON invoices(month);
