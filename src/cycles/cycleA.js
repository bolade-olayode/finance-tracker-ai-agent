// src/cycles/cycleA.js
// Daily ingestion. Idempotent + catch-up: processes ALL pending rows whenever triggered,
// never tied to a clock. Math via the engine; Claude only for unknown merchants.

import { categorizeTransaction } from '../engine/categorize.js';
import { computeDailyAggregate } from '../engine/compute.js';

export async function runCycleA({ dataSource, classifier, date } = {}) {
  const runDate = date || new Date().toISOString().slice(0, 10);
  const pending = await dataSource.getPendingTransactions();

  let aiCalls = 0, learned = 0, errors = 0;
  const wrapped = classifier ? async (...a) => { aiCalls++; return classifier(...a); } : null;
  const updates = [];

  for (const txn of pending) {
    const { result, learned: entry } = await categorizeTransaction(txn, { classifier: wrapped });

    // fold categorization back onto the txn so the aggregate sees it
    txn.category_tier1 = result.category_tier1;
    txn.category_tier2 = txn.category_tier2 || result.category_tier2;
    txn.is_recurring = result.is_recurring;

    if (result.source === 'error') errors++;
    if (entry) { await dataSource.learnMerchant(entry); learned++; }

    updates.push({
      transaction_id: txn.transaction_id,
      category_tier1: result.category_tier1 || '',
      category_tier2: result.category_tier2 || '',
      normalized_desc: result.normalized_desc || '',
      merchant_tag: result.merchant_tag || '',
      is_recurring: result.is_recurring ? 1 : 0,
      source: result.source || '',
      flags: result.flags || '',
      AI_processed: result.ai_processed || 'TRUE',
    });
  }

  await dataSource.writeCategorizations(updates);

  // Adjust account balances for each newly-processed transaction.
  if (dataSource.setAccountBalance && pending.length > 0) {
    const currentBalances = await dataSource.getAccountBalances();
    const deltas = {};
    for (const txn of pending) {
      const id = txn.account_id;
      if (!id) continue;
      if (!(id in deltas)) deltas[id] = 0;
      deltas[id] += txn.type === 'CREDIT' ? txn.amount : -txn.amount;
    }
    for (const [id, delta] of Object.entries(deltas)) {
      const prev = currentBalances[id] || 0;
      await dataSource.setAccountBalance(id, prev + delta);
    }
  }

  const [cashLedger, targets, accountBalances, allTodayTxns] = await Promise.all([
    dataSource.getCashLedger(), dataSource.getTargets(), dataSource.getAccountBalances(),
    dataSource.getTransactionsByDate ? dataSource.getTransactionsByDate(runDate) : Promise.resolve(pending),
  ]);

  const aggregate = computeDailyAggregate({ date: runDate, transactions: allTodayTxns, cashLedger, targets, accountBalances });
  await dataSource.appendDailyAggregate(aggregate);

  return { processed: pending.length, aiCalls, learned, errors, aggregate };
}

// Allow `npm run cycle:a` to run it directly against the mock (no creds needed).
if (import.meta.url === `file://${process.argv[1]}`) {
  const { createMockDataSource } = await import('../sheets/dataSource.js');
  const r = await runCycleA({ dataSource: createMockDataSource() });
  console.log(JSON.stringify(r.aggregate, null, 2));
}
