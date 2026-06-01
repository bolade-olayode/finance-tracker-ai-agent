// src/engine/compute.js
// ALL money math lives here. Claude is NEVER asked to do arithmetic — that is the core
// of the "zero hallucinated figures" guarantee. These functions are pure and unit-testable.

import { ACCOUNTS, isSpending } from '../../config/accounts.js';
import { calcTransferCost, calcWithdrawalCost } from '../../config/fees.js';

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const sum = (arr, f) => round2(arr.reduce((a, x) => a + (f ? f(x) : x), 0));

const EXCLUDED_TYPES = new Set(['INTERNAL_TRANSFER', 'TRANSFER_OUT', 'TRANSFER_IN']);
const SAVINGS_TIER2 = 'Savings: PiggyVest Target Deposit';

// ── Fees ───────────────────────────────────────────────────────────────────
// Derives bank/stamp/withdrawal fees from the transactions themselves so we never
// rely on the user to log fees, and flags transfers whose CBN fee was avoidable via Opay.
export function computeFees(transactions) {
  let transferFees = 0, withdrawalFees = 0, avoidable = 0;
  const avoidableFlags = [];

  for (const t of transactions) {
    const acct = ACCOUNTS[t.account_id];
    if (!acct) continue;

    if (['TRANSFER_OUT', 'EXPENSE', 'INTERNAL_TRANSFER'].includes(t.transaction_type)
        && ['Transfer', 'USSD', 'App'].includes(t.channel)) {
      const c = calcTransferCost({
        amount: t.amount, provider: acct.provider,
        transactionType: t.transaction_type, categoryTier2: t.category_tier2,
      });
      transferFees = round2(transferFees + c.total);
      // Only genuine outbound PAYMENTS are "avoidable via Opay". Funding your own Opay
      // wallet from Access still costs the Access fee — that's not avoidable.
      if (c.avoidableViaOpay > 0 && t.transaction_type === 'EXPENSE') {
        avoidable = round2(avoidable + c.avoidableViaOpay);
        avoidableFlags.push({ id: t.transaction_id, amount: t.amount, savedIfOpay: c.avoidableViaOpay, bank: acct.bank });
      }
    }

    if (t.transaction_type === 'CASH_WITHDRAWAL' || t.channel === 'ATM') {
      withdrawalFees = round2(withdrawalFees + calcWithdrawalCost(t.amount));
    }
  }

  return {
    transferFeesTotal: transferFees,
    withdrawalFeesTotal: withdrawalFees,
    feesTotal: round2(transferFees + withdrawalFees),
    avoidableViaOpay: avoidable,
    avoidableFlags,
  };
}

// ── Interest accrual ─────────────────────────────────────────────────────────
export function dailyInterest(targets) {
  const perTarget = targets.map((t) => ({
    id: t.id,
    interest: round2((t.currentBalance * t.interestRatePa) / 365),
  }));
  return { perTarget, total: sum(perTarget, (x) => x.interest) };
}

// ── Daily aggregate (Cycle A output row) ──────────────────────────────────────
export function computeDailyAggregate({ date, transactions, cashLedger = [], targets = [], accountBalances = {} }) {
  const credits = transactions.filter((t) => t.type === 'CREDIT');
  const debits = transactions.filter((t) => t.type === 'DEBIT');

  const totalInflow = sum(credits, (t) => t.amount);
  const totalOutflow = sum(debits, (t) => t.amount);
  const realInflow = sum(credits.filter((t) => !EXCLUDED_TYPES.has(t.transaction_type)), (t) => t.amount);
  const internalTransfers = sum(debits.filter((t) => EXCLUDED_TYPES.has(t.transaction_type)), (t) => t.amount);
  const savingsDeposits = sum(debits.filter((t) => t.category_tier2 === SAVINGS_TIER2), (t) => t.amount);
  const cashWithdrawnTxn = sum(debits.filter((t) => t.transaction_type === 'CASH_WITHDRAWAL'), (t) => t.amount);

  // Cash ledger figures. The WITHDRAWAL is not a spend (rule #4) — the logged cash spends are.
  const cashWithdrawn = sum(cashLedger, (c) => c.amountWithdrawn || 0);
  const cashSpentLogged = sum(cashLedger, (c) => c.amountAccounted || 0);
  const cashUnaccounted = round2(cashWithdrawn - cashSpentLogged);

  // Electronic real spend excludes transfers, savings, AND cash-withdrawal money-movement.
  // True burn = electronic real spend + cash actually spent (from the ledger).
  const electronicRealSpend = round2(totalOutflow - internalTransfers - savingsDeposits - cashWithdrawnTxn);
  const netRealSpend = round2(electronicRealSpend + cashSpentLogged);

  // Real-spend transactions only (exclude transfers, savings, cash-withdrawals) for the leaderboard.
  const realSpend = debits.filter(
    (t) => !EXCLUDED_TYPES.has(t.transaction_type)
      && t.transaction_type !== 'CASH_WITHDRAWAL'
      && t.category_tier2 !== SAVINGS_TIER2,
  );
  const byCat = {};
  for (const t of realSpend) {
    if (!t.category_tier1) continue; // unresolved ERROR rows count as outflow but claim no category
    byCat[t.category_tier1] = round2((byCat[t.category_tier1] || 0) + t.amount);
  }
  const [topCategory = '', topAmount = 0] =
    Object.entries(byCat).sort((a, b) => b[1] - a[1])[0] || [];

  // Item-level leaderboard — group by normalized_desc, sort by total spend descending.
  const byItem = {};
  for (const t of realSpend) {
    if (!t.normalized_desc) continue;
    byItem[t.normalized_desc] = round2((byItem[t.normalized_desc] || 0) + t.amount);
  }
  const topItems = Object.entries(byItem)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([item, amount]) => ({ item, amount }));

  const fees = computeFees(transactions);
  const interest = dailyInterest(targets);
  const totalSavingsValue = round2(sum(targets, (t) => t.currentBalance) + interest.total);
  const spendingBalances = round2(
    Object.entries(accountBalances).filter(([id]) => isSpending(id)).reduce((a, [, v]) => a + v, 0),
  );
  const estimatedNetWorth = round2(spendingBalances + totalSavingsValue);

  const lateNight = sum(
    realSpend.filter((t) => t.time && Number(t.time.slice(0, 2)) >= 22),
    (t) => t.amount,
  );
  const recurring = sum(realSpend.filter((t) => t.is_recurring), (t) => t.amount);

  const anomalies = [];
  if (cashUnaccounted > 0) anomalies.push('CASH_GAP');
  if (fees.avoidableViaOpay > 0) anomalies.push('HIGH_FEES');

  return {
    date,
    total_inflow: totalInflow,
    total_outflow: totalOutflow,
    internal_transfers: internalTransfers,
    savings_deposits: savingsDeposits,
    real_inflow: realInflow,
    cash_withdrawn: cashWithdrawn,
    cash_spent_logged: cashSpentLogged,
    cash_unaccounted: cashUnaccounted,
    net_real_spend: netRealSpend,
    net_daily: round2(totalInflow - totalOutflow),
    top_category: topCategory,
    top_category_amount: topAmount,
    transaction_count: transactions.length,
    recurring_charges_total: recurring,
    late_night_spend: lateNight,
    transfer_fees_total: fees.feesTotal,
    avoidable_fees: fees.avoidableViaOpay,
    savings_interest_today: interest.total,
    total_savings_value: totalSavingsValue,
    estimated_net_worth: estimatedNetWorth,
    anomaly_flags: anomalies.join(', '),
    top_items: topItems,
  };
}

// ── PiggyVest target evaluation (on-track logic) ──────────────────────────────
const monthsBetween = (from, to) =>
  (new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24 * 30.4375);
const daysBetween = (from, to) =>
  Math.round((new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24));

export function evaluateTarget(target, asOf = new Date()) {
  const { goalAmount, currentBalance, monthlyContribution, targetDate } = target;
  if (!goalAmount || goalAmount <= 0) {
    return { id: target.id, nickname: target.nickname, progressPct: 0, isOnTrack: 'UNKNOWN', note: 'goal not set' };
  }
  const progressPct = round2((currentBalance / goalAmount) * 100);
  const remaining = round2(goalAmount - currentBalance);

  let isOnTrack = 'TRUE';
  let requiredMonthly = 0;
  let projectedCompletion = null;

  if (targetDate) {
    const monthsLeft = Math.max(monthsBetween(asOf, targetDate), 0.0001);
    requiredMonthly = round2(remaining / monthsLeft);
    if (monthlyContribution >= requiredMonthly) isOnTrack = 'TRUE';
    else if (monthlyContribution >= 0.9 * requiredMonthly) isOnTrack = 'AT_RISK';
    else isOnTrack = 'FALSE';
  }
  if (monthlyContribution > 0) {
    const monthsToFill = remaining / monthlyContribution;
    const d = new Date(asOf);
    d.setMonth(d.getMonth() + Math.ceil(monthsToFill));
    projectedCompletion = d.toISOString().slice(0, 10);
  }

  return {
    id: target.id,
    nickname: target.nickname,
    progressPct,
    remaining,
    requiredMonthly,
    daysRemaining: targetDate ? daysBetween(asOf, targetDate) : null,
    projectedCompletion,
    isOnTrack,
  };
}

// ── Fortnightly rollup (Cycle B) ──────────────────────────────────────────────
export function computeFortnightly(dailyRows, targets, asOf = new Date()) {
  const totalInflow = sum(dailyRows, (r) => r.real_inflow ?? r.total_inflow);
  const totalOutflow = sum(dailyRows, (r) => r.total_outflow);
  const netRealSpend = sum(dailyRows, (r) => r.net_real_spend);
  const interestEarned = sum(dailyRows, (r) => r.savings_interest_today);
  const cashUnaccounted = sum(dailyRows, (r) => r.cash_unaccounted);
  const feesTotal = sum(dailyRows, (r) => r.transfer_fees_total);
  const avoidableFees = sum(dailyRows, (r) => r.avoidable_fees);

  const savingsRate = totalInflow > 0
    ? round2(((totalInflow - netRealSpend) / totalInflow) * 100)
    : 0;

  const netWorthStart = dailyRows[0]?.estimated_net_worth ?? 0;
  const netWorthEnd = dailyRows.at(-1)?.estimated_net_worth ?? 0;

  return {
    totalInflow,
    totalOutflow,
    netRealSpend,
    savingsRate,
    interestEarned,
    cashUnaccounted,
    feesTotal,
    avoidableFees,
    netWorthStart,
    netWorthEnd,
    netWorthDelta: round2(netWorthEnd - netWorthStart),
    targets: targets.map((t) => evaluateTarget(t, asOf)),
  };
}

export { round2 };
