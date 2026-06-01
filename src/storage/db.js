// src/storage/db.js
// SQLite database setup. Creates the file + all tables on first run.
// Import `getDb()` anywhere — returns the same singleton connection.

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', '..', 'data', 'finance.db');

// Ensure data/ directory exists
import { mkdirSync } from 'fs';
mkdirSync(path.dirname(DB_PATH), { recursive: true });

let _db;
export function getDb() {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');  // safe concurrent reads
  _db.pragma('foreign_keys = ON');
  bootstrap(_db);
  return _db;
}

function bootstrap(db) {
  db.exec(`
    -- Every transaction you log or the bot ingests.
    CREATE TABLE IF NOT EXISTS transactions (
      transaction_id    TEXT PRIMARY KEY,
      account_id        TEXT NOT NULL,
      amount            REAL NOT NULL,
      type              TEXT NOT NULL DEFAULT 'DEBIT',   -- CREDIT | DEBIT
      transaction_type  TEXT NOT NULL DEFAULT 'EXPENSE', -- EXPENSE | INCOME | CASH_WITHDRAWAL | INTERNAL_TRANSFER | ...
      channel           TEXT,
      raw_description   TEXT,
      time              TEXT,
      date              TEXT DEFAULT (date('now','localtime')),
      AI_processed      TEXT DEFAULT 'PENDING',          -- PENDING | TRUE | ERROR
      -- categorization fields (written back by Cycle A)
      category_tier1    TEXT,
      category_tier2    TEXT,
      merchant_tag      TEXT,
      normalized_desc   TEXT,
      is_recurring      INTEGER DEFAULT 0,
      source            TEXT,   -- structural | merchant-map | item-map | claude | error
      flags             TEXT,
      sheets_synced     INTEGER DEFAULT 0,
      created_at        TEXT DEFAULT (datetime('now','localtime'))
    );

    -- Cash withdrawals + how much of it was accounted for via cash logs.
    CREATE TABLE IF NOT EXISTS cash_ledger (
      id                TEXT PRIMARY KEY,
      date              TEXT DEFAULT (date('now','localtime')),
      amount_withdrawn  REAL NOT NULL,
      amount_accounted  REAL DEFAULT 0
    );

    -- PiggyVest target plans (mirrors config/profile.js but editable live).
    CREATE TABLE IF NOT EXISTS savings_targets (
      id                TEXT PRIMARY KEY,
      nickname          TEXT,
      goal_amount       REAL DEFAULT 0,
      current_balance   REAL DEFAULT 0,
      monthly_contribution REAL DEFAULT 0,
      interest_rate_pa  REAL DEFAULT 0.10,
      start_date        TEXT,
      target_date       TEXT,
      withdrawal_type   TEXT DEFAULT 'FLEXIBLE',
      status            TEXT DEFAULT 'ACTIVE'
    );

    -- Account balances (updated manually or by Cycle A).
    CREATE TABLE IF NOT EXISTS account_balances (
      account_id        TEXT PRIMARY KEY,
      balance           REAL DEFAULT 0,
      updated_at        TEXT DEFAULT (datetime('now','localtime'))
    );

    -- Daily aggregate rows (output of Cycle A).
    CREATE TABLE IF NOT EXISTS daily_aggregates (
      date                    TEXT PRIMARY KEY,
      total_inflow            REAL DEFAULT 0,
      total_outflow           REAL DEFAULT 0,
      real_inflow             REAL DEFAULT 0,
      internal_transfers      REAL DEFAULT 0,
      savings_deposits        REAL DEFAULT 0,
      cash_withdrawn          REAL DEFAULT 0,
      cash_spent_logged       REAL DEFAULT 0,
      cash_unaccounted        REAL DEFAULT 0,
      net_real_spend          REAL DEFAULT 0,
      net_daily               REAL DEFAULT 0,
      top_category            TEXT,
      top_category_amount     REAL DEFAULT 0,
      top_items               TEXT,   -- JSON array
      transaction_count       INTEGER DEFAULT 0,
      recurring_charges_total REAL DEFAULT 0,
      late_night_spend        REAL DEFAULT 0,
      transfer_fees_total     REAL DEFAULT 0,
      avoidable_fees          REAL DEFAULT 0,
      savings_interest_today  REAL DEFAULT 0,
      total_savings_value     REAL DEFAULT 0,
      estimated_net_worth     REAL DEFAULT 0,
      anomaly_flags           TEXT,
      created_at              TEXT DEFAULT (datetime('now','localtime'))
    );

    -- Fortnightly reports (archived output of Cycle B).
    CREATE TABLE IF NOT EXISTS fortnightly_reports (
      report_id         TEXT PRIMARY KEY,
      period_start      TEXT,
      period_end        TEXT,
      payload           TEXT,   -- full JSON blob
      created_at        TEXT DEFAULT (datetime('now','localtime'))
    );

    -- Self-learned merchants from Claude (mirrors config/merchant-map.js growth).
    CREATE TABLE IF NOT EXISTS learned_merchants (
      match_key         TEXT PRIMARY KEY,
      tier1             TEXT,
      tier2             TEXT,
      merchant          TEXT,
      recurring         INTEGER DEFAULT 0,
      created_at        TEXT DEFAULT (datetime('now','localtime'))
    );
  `);
}
