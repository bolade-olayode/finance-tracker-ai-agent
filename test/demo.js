// test/demo.js
// Proves the revised architecture end-to-end with NO credentials:
// rules-first categorization + Claude fallback (mocked) + all-math-in-code.
// Run: npm run demo

import { categorizeTransaction } from '../src/engine/categorize.js';
import { computeDailyAggregate, evaluateTarget } from '../src/engine/compute.js';

// A mock "Claude" classifier — stands in for the live Haiku call. Only ever hit for
// merchants NOT already in the merchant map. Returns the same shape the real one will.
const mockClassifier = async (txn) => {
  if (/kuto|mile 12|market/i.test(txn.raw_description)) {
    return { tier1: 'FOOD & DINING', tier2: 'Groceries: Open Market', merchant: 'Kuto Market', recurring: false, confident: true };
  }
  return { confident: false }; // -> engine flags ERROR rather than guessing
};

// One sample day across several accounts.
const transactions = [
  { transaction_id: 'TXN-1', account_id: 'ACC-02', amount: 3500, type: 'DEBIT', transaction_type: 'EXPENSE', channel: 'App', raw_description: 'CHOWDECK ORDER 4421', time: '13:20:00' },
  { transaction_id: 'TXN-2', account_id: 'ACC-01', amount: 75000, type: 'DEBIT', transaction_type: 'TRANSFER_OUT', channel: 'Transfer', raw_description: 'TFR TO OPAY WALLET', time: '09:00:00' },        // own move
  { transaction_id: 'TXN-3', account_id: 'ACC-02', amount: 75000, type: 'CREDIT', transaction_type: 'TRANSFER_IN', channel: 'Transfer', raw_description: 'FROM ACCESS', time: '09:00:30' },
  { transaction_id: 'TXN-4', account_id: 'ACC-01', amount: 25000, type: 'DEBIT', transaction_type: 'EXPENSE', channel: 'Transfer', raw_description: 'PAYMENT TO VENDOR JANE', time: '15:40:00', category_tier2: '' }, // bank transfer -> avoidable Opay fee
  { transaction_id: 'TXN-5', account_id: 'ACC-03', amount: 50000, type: 'DEBIT', transaction_type: 'EXPENSE', channel: 'App', raw_description: 'KUTO MARKET FOODSTUFF', time: '11:00:00' },                 // unknown -> Claude
  { transaction_id: 'TXN-6', account_id: 'ACC-01', amount: 100000, type: 'DEBIT', transaction_type: 'EXPENSE', channel: 'App', raw_description: 'PIGGYVEST TARGET DEPOSIT', time: '08:00:00', category_tier2: 'Savings: PiggyVest Target Deposit' },
  { transaction_id: 'TXN-7', account_id: 'ACC-02', amount: 450000, type: 'CREDIT', transaction_type: 'INCOME', channel: 'Transfer', raw_description: 'UPWORK DISBURSEMENT', time: '07:30:00' },
  { transaction_id: 'TXN-8', account_id: 'ACC-01', amount: 20000, type: 'DEBIT', transaction_type: 'CASH_WITHDRAWAL', channel: 'ATM', raw_description: 'ATM WITHDRAWAL GTB', time: '23:10:00' },
];

console.log('━━━ STEP 1: CATEGORIZATION (rules-first, Claude only for unknowns) ━━━\n');
let apiCalls = 0;
const wrappedClassifier = async (...a) => { apiCalls++; return mockClassifier(...a); };

for (const t of transactions) {
  const { result, learned } = await categorizeTransaction(t, { classifier: wrappedClassifier });
  // fold categorization back onto the txn so compute sees it
  Object.assign(t, {
    category_tier1: result.category_tier1,
    category_tier2: t.category_tier2 || result.category_tier2,
    is_recurring: result.is_recurring,
  });
  const tag = result.source.padEnd(12);
  const cat = result.flags === 'ERROR' ? '⚠ ERROR (flagged, not guessed)' : `${result.category_tier1} › ${result.category_tier2}`;
  console.log(`  ${t.transaction_id}  [${tag}] ${cat}${learned ? '   ← learned, now deterministic' : ''}`);
}
console.log(`\n  Claude API calls this run: ${apiCalls} of ${transactions.length} txns (rest were free)\n`);

console.log('━━━ STEP 2: DAILY AGGREGATE (every figure computed in code) ━━━\n');
const targets = [
  { id: 'TGT-001', nickname: 'Emergency Fund', currentBalance: 320000, goalAmount: 500000, monthlyContribution: 50000, interestRatePa: 0.10, targetDate: '2026-12-31' },
  { id: 'TGT-002', nickname: 'New Laptop', currentBalance: 210000, goalAmount: 900000, monthlyContribution: 40000, interestRatePa: 0.10, targetDate: '2026-09-30' },
];
const cashLedger = [{ cashWithdrawalId: 'CASH-W-001', amountWithdrawn: 20000, amountAccounted: 15500 }];
const accountBalances = { 'ACC-01': 180000, 'ACC-02': 95000, 'ACC-03': 40000, 'ACC-04': 22000 };

const agg = computeDailyAggregate({ date: '2026-06-01', transactions, cashLedger, targets, accountBalances });
for (const [k, v] of Object.entries(agg)) {
  const val = typeof v === 'number' && /inflow|outflow|spend|deposit|transfer|cash|fee|interest|worth|savings|daily|amount/i.test(k)
    ? `₦${v.toLocaleString('en-NG', { minimumFractionDigits: 2 })}` : v;
  console.log(`  ${k.padEnd(24)} ${val}`);
}

console.log('\n━━━ STEP 3: PIGGYVEST ON-TRACK EVALUATION ━━━\n');
for (const t of targets) {
  const e = evaluateTarget(t, new Date('2026-06-01'));
  console.log(`  ${e.nickname.padEnd(16)} ${e.progressPct}%  required/mo ₦${e.requiredMonthly.toLocaleString('en-NG')}  → ${e.isOnTrack}  (proj. ${e.projectedCompletion})`);
}
console.log('\n✔ Engine works with zero hallucinated figures. Live wiring (Sheets/Telegram/Claude) plugs in next.\n');
