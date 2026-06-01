// src/storage/sqliteDataSource.js
// Implements the exact same interface as createMockDataSource() — drop-in replacement.
// All data persists to data/finance.db (SQLite file).

import { getDb } from './db.js';
import { TARGETS } from '../../config/profile.js';
import { randomUUID } from 'crypto';

export function createSQLiteDataSource() {
  const db = getDb();

  // Seed savings targets from config/profile.js on first run (if table is empty).
  const targetCount = db.prepare('SELECT COUNT(*) as n FROM savings_targets').get().n;
  if (targetCount === 0) {
    const insert = db.prepare(`
      INSERT OR IGNORE INTO savings_targets
        (id, nickname, goal_amount, current_balance, monthly_contribution, interest_rate_pa, start_date, target_date, withdrawal_type, status)
      VALUES (@id, @nickname, @goalAmount, @currentBalance, @monthlyContribution, @interestRatePa, @startDate, @targetDate, @withdrawalType, @status)
    `);
    for (const t of TARGETS) db.transaction(() => insert.run(t))();
  }

  return {
    // ── Transactions ───────────────────────────────────────────────────────

    async getPendingTransactions() {
      return db.prepare(`SELECT * FROM transactions WHERE AI_processed = 'PENDING' ORDER BY date, time`).all();
    },

    async getTransactionsByDate(date) {
      return db.prepare(`SELECT * FROM transactions WHERE date = ? ORDER BY time`).all(date);
    },

    async getUnsyncedTransactions() {
      return db.prepare(`SELECT * FROM transactions WHERE sheets_synced = 0 AND AI_processed = 'TRUE' ORDER BY date, time`).all();
    },

    async markTransactionsSynced(ids) {
      if (!ids.length) return;
      const placeholders = ids.map(() => '?').join(',');
      db.prepare(`UPDATE transactions SET sheets_synced = 1 WHERE transaction_id IN (${placeholders})`).run(...ids);
    },

    async writeCategorizations(updates) {
      const stmt = db.prepare(`
        UPDATE transactions SET
          AI_processed    = @AI_processed,
          category_tier1  = @category_tier1,
          category_tier2  = @category_tier2,
          merchant_tag    = @merchant_tag,
          normalized_desc = @normalized_desc,
          is_recurring    = @is_recurring,
          source          = @source,
          flags           = @flags
        WHERE transaction_id = @transaction_id
      `);
      db.transaction(() => {
        for (const u of updates) {
          stmt.run({
            transaction_id:  u.transaction_id,
            AI_processed:    u.AI_processed   ?? 'TRUE',
            category_tier1:  u.category_tier1 ?? '',
            category_tier2:  u.category_tier2 ?? '',
            merchant_tag:    u.merchant_tag   ?? '',
            normalized_desc: u.normalized_desc?? '',
            is_recurring:    u.is_recurring   ?? 0,
            source:          u.source         ?? '',
            flags:           u.flags          ?? '',
          });
        }
      })();
    },

    async appendTransaction(row) {
      const id = row.transaction_id || `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      db.prepare(`
        INSERT INTO transactions (transaction_id, account_id, amount, type, transaction_type, channel, raw_description, time, date, AI_processed)
        VALUES (@transaction_id, @account_id, @amount, @type, @transaction_type, @channel, @raw_description, @time, @date, 'PENDING')
      `).run({
        transaction_id: id,
        account_id: row.account_id || 'ACC-02',
        amount: row.amount,
        type: row.type || 'DEBIT',
        transaction_type: row.transaction_type || 'EXPENSE',
        channel: row.channel || 'App',
        raw_description: row.raw_description || '',
        time: row.time || new Date().toTimeString().slice(0, 8),
        date: row.date || new Date().toISOString().slice(0, 10),
      });
      return id;
    },

    // ── Cash ledger ────────────────────────────────────────────────────────

    async getCashLedger() {
      const rows = db.prepare(`SELECT * FROM cash_ledger WHERE date = date('now','localtime')`).all();
      return rows.map((r) => ({ cashWithdrawalId: r.id, amountWithdrawn: r.amount_withdrawn, amountAccounted: r.amount_accounted }));
    },

    async logCashWithdrawal(amount) {
      const id = `CASH-W-${Date.now()}`;
      db.prepare(`INSERT INTO cash_ledger (id, amount_withdrawn) VALUES (?, ?)`).run(id, amount);
      return id;
    },

    async recordCashSpend(withdrawalId, amount) {
      db.prepare(`UPDATE cash_ledger SET amount_accounted = amount_accounted + ? WHERE id = ?`).run(amount, withdrawalId);
    },

    // ── Savings targets ────────────────────────────────────────────────────

    async getTargets() {
      const rows = db.prepare(`SELECT * FROM savings_targets WHERE status = 'ACTIVE'`).all();
      if (!rows.length) return TARGETS;
      return rows.map((r) => ({
        id: r.id,
        nickname: r.nickname,
        goalAmount: r.goal_amount,
        currentBalance: r.current_balance,
        monthlyContribution: r.monthly_contribution,
        interestRatePa: r.interest_rate_pa,
        startDate: r.start_date,
        targetDate: r.target_date,
        withdrawalType: r.withdrawal_type,
        status: r.status,
      }));
    },

    async updateTargetBalance(id, newBalance) {
      db.prepare(`UPDATE savings_targets SET current_balance = ? WHERE id = ?`).run(newBalance, id);
    },

    // ── Account balances ───────────────────────────────────────────────────

    async getAccountBalances() {
      const rows = db.prepare(`SELECT account_id, balance FROM account_balances`).all();
      return Object.fromEntries(rows.map((r) => [r.account_id, r.balance]));
    },

    async setAccountBalance(accountId, balance) {
      db.prepare(`INSERT INTO account_balances (account_id, balance) VALUES (?, ?)
                  ON CONFLICT(account_id) DO UPDATE SET balance = excluded.balance, updated_at = datetime('now','localtime')`)
        .run(accountId, balance);
    },

    // ── Daily aggregates ───────────────────────────────────────────────────

    async appendDailyAggregate(row) {
      const n = (v) => Number(v) || 0;
      db.prepare(`
        INSERT OR REPLACE INTO daily_aggregates
          (date, total_inflow, total_outflow, real_inflow, internal_transfers, savings_deposits,
           cash_withdrawn, cash_spent_logged, cash_unaccounted, net_real_spend, net_daily,
           top_category, top_category_amount, top_items, transaction_count,
           recurring_charges_total, late_night_spend, transfer_fees_total, avoidable_fees,
           savings_interest_today, total_savings_value, estimated_net_worth, anomaly_flags)
        VALUES
          (@date, @total_inflow, @total_outflow, @real_inflow, @internal_transfers, @savings_deposits,
           @cash_withdrawn, @cash_spent_logged, @cash_unaccounted, @net_real_spend, @net_daily,
           @top_category, @top_category_amount, @top_items, @transaction_count,
           @recurring_charges_total, @late_night_spend, @transfer_fees_total, @avoidable_fees,
           @savings_interest_today, @total_savings_value, @estimated_net_worth, @anomaly_flags)
      `).run({
        date:                     row.date || new Date().toISOString().slice(0, 10),
        total_inflow:             n(row.total_inflow),
        total_outflow:            n(row.total_outflow),
        real_inflow:              n(row.real_inflow),
        internal_transfers:       n(row.internal_transfers),
        savings_deposits:         n(row.savings_deposits),
        cash_withdrawn:           n(row.cash_withdrawn),
        cash_spent_logged:        n(row.cash_spent_logged),
        cash_unaccounted:         n(row.cash_unaccounted),
        net_real_spend:           n(row.net_real_spend),
        net_daily:                n(row.net_daily),
        top_category:             row.top_category    || '',
        top_category_amount:      n(row.top_category_amount),
        top_items:                JSON.stringify(row.top_items || []),
        transaction_count:        n(row.transaction_count),
        recurring_charges_total:  n(row.recurring_charges_total),
        late_night_spend:         n(row.late_night_spend),
        transfer_fees_total:      n(row.transfer_fees_total),
        avoidable_fees:           n(row.avoidable_fees),
        savings_interest_today:   n(row.savings_interest_today),
        total_savings_value:      n(row.total_savings_value),
        estimated_net_worth:      n(row.estimated_net_worth),
        anomaly_flags:            row.anomaly_flags   || '',
      });
    },

    async getDailyAggregates(start, end) {
      const rows = db.prepare(`SELECT * FROM daily_aggregates WHERE date BETWEEN ? AND ? ORDER BY date`).all(start, end);
      return rows.map((r) => ({ ...r, top_items: JSON.parse(r.top_items || '[]') }));
    },

    // ── Fortnightly reports ────────────────────────────────────────────────

    async appendFortnightlyReport(row) {
      db.prepare(`INSERT OR REPLACE INTO fortnightly_reports (report_id, period_start, period_end, payload)
                  VALUES (?, ?, ?, ?)`)
        .run(row.report_id || randomUUID(), row.period_start, row.period_end, JSON.stringify(row));
    },

    // ── Merchant learning ──────────────────────────────────────────────────

    async learnMerchant(entry) {
      db.prepare(`INSERT OR IGNORE INTO learned_merchants (match_key, tier1, tier2, merchant, recurring)
                  VALUES (?, ?, ?, ?, ?)`)
        .run(entry.match.toLowerCase(), entry.tier1, entry.tier2, entry.merchant, entry.recurring ? 1 : 0);
    },
  };
}
