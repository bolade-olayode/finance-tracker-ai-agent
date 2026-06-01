// src/sheets/dataSource.js
// The cycles depend on this INTERFACE, not on Google Sheets directly. That lets us run
// the whole control loop locally against a mock today, then drop in the real Sheets
// adapter later with zero changes to the cycle logic.
//
// A data source implements:
//   getPendingTransactions()                 -> raw txns where AI_processed === 'PENDING'
//   writeCategorizations(updates)            -> persist Claude/rule output + flip AI_processed
//   getCashLedger()                          -> cash withdrawal/spend reconciliation rows
//   getTargets()                             -> PiggyVest target plans
//   getAccountBalances()                     -> { accountId: balance }
//   appendDailyAggregate(row)                -> write one DAILY_AGGREGATES row
//   getDailyAggregates(start, end)           -> rows in an inclusive date range (Cycle B)
//   appendFortnightlyReport(row)             -> archive a Cycle B report
//   learnMerchant(entry)                     -> persist a newly-resolved merchant

import { TARGETS } from '../../config/profile.js';

// ── Local mock: sample data so you can press the Telegram button before Sheets exists ──
export function createMockDataSource() {
  const pending = [
    { transaction_id: 'TXN-1', account_id: 'ACC-02', amount: 3500, type: 'DEBIT', transaction_type: 'EXPENSE', channel: 'App', raw_description: 'CHOWDECK ORDER 4421', time: '13:20:00', AI_processed: 'PENDING' },
    { transaction_id: 'TXN-2', account_id: 'ACC-01', amount: 25000, type: 'DEBIT', transaction_type: 'EXPENSE', channel: 'Transfer', raw_description: 'PAYMENT TO VENDOR JANE', time: '15:40:00', AI_processed: 'PENDING' },
    { transaction_id: 'TXN-3', account_id: 'ACC-01', amount: 1200, type: 'DEBIT', transaction_type: 'EXPENSE', channel: 'App', raw_description: 'NETFLIX SUBSCRIPTION', time: '02:00:00', AI_processed: 'PENDING' },
    { transaction_id: 'TXN-4', account_id: 'ACC-02', amount: 450000, type: 'CREDIT', transaction_type: 'INCOME', channel: 'Transfer', raw_description: 'UPWORK DISBURSEMENT', time: '07:30:00', AI_processed: 'PENDING' },
    { transaction_id: 'TXN-5', account_id: 'ACC-03', amount: 6800, type: 'DEBIT', transaction_type: 'EXPENSE', channel: 'POS', raw_description: 'KUTO MARKET FOODSTUFF', time: '11:00:00', AI_processed: 'PENDING' },
  ];

  return {
    async getPendingTransactions() { return pending.filter((t) => t.AI_processed === 'PENDING'); },
    async writeCategorizations(updates) {
      for (const u of updates) {
        const t = pending.find((p) => p.transaction_id === u.transaction_id);
        if (t) Object.assign(t, u);
      }
      console.log(`   [mock] wrote ${updates.length} categorizations`);
    },
    async getCashLedger() { return [{ cashWithdrawalId: 'CASH-W-001', amountWithdrawn: 20000, amountAccounted: 15500 }]; },
    async getTargets() { return TARGETS.filter((t) => t.goalAmount > 0).length ? TARGETS : SAMPLE_TARGETS; },
    async getAccountBalances() { return { 'ACC-01': 180000, 'ACC-02': 95000, 'ACC-03': 40000, 'ACC-04': 22000 }; },
    async appendDailyAggregate(row) { console.log(`   [mock] appended DAILY_AGGREGATES row for ${row.date}`); },
    async getDailyAggregates() { return SAMPLE_DAILY_ROWS; },
    async appendFortnightlyReport(row) { console.log(`   [mock] archived report ${row.report_id}`); },
    async learnMerchant(entry) { console.log(`   [mock] learned merchant: ${entry.merchant} -> ${entry.tier1}/${entry.tier2}`); },
    async appendTransaction(row) {
      const id = `TXN-${pending.length + 1}`;
      // Caller sets type/transaction_type explicitly; these are defaults only for legacy callers.
      pending.push({ transaction_id: id, AI_processed: 'PENDING', type: 'DEBIT', transaction_type: 'EXPENSE', ...row });
      console.log(`   [mock] logged ${id}: ₦${row.amount} ${row.raw_description} [${row.type || 'DEBIT'}]`);
      return id;
    },
  };
}

const SAMPLE_TARGETS = [
  { id: 'TGT-001', nickname: 'Emergency Fund', currentBalance: 320000, goalAmount: 500000, monthlyContribution: 50000, interestRatePa: 0.10, targetDate: '2026-12-31' },
  { id: 'TGT-002', nickname: 'New Laptop', currentBalance: 210000, goalAmount: 900000, monthlyContribution: 40000, interestRatePa: 0.10, targetDate: '2026-09-30' },
  { id: 'TGT-003', nickname: 'Japa Fund', currentBalance: 1400000, goalAmount: 3000000, monthlyContribution: 200000, interestRatePa: 0.10, targetDate: '2027-06-30' },
];

const SAMPLE_DAILY_ROWS = Array.from({ length: 14 }, (_, i) => ({
  date: `2026-05-${String(18 + i).padStart(2, '0')}`,
  real_inflow: i === 0 ? 450000 : 0,
  total_outflow: 12000 + i * 800,
  net_real_spend: 11000 + i * 700,
  savings_interest_today: 145.2,
  cash_unaccounted: i === 3 ? 4500 : 0,
  transfer_fees_total: 150 + i * 10,
  avoidable_fees: i % 2 === 0 ? 25 : 0,
  estimated_net_worth: 860000 + i * 1500,
}));
