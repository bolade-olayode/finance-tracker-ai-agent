// src/engine/categorize.js
// Rules-first router. Order of resolution:
//   1. Structural types (transfers, cash withdrawals, savings) -> deterministic tags, NO API call
//   2. Known merchant -> merchant-map hit, NO API call
//   3. Unknown -> Claude fallback (injected `classifier`), result validated against the
//      real category tree. Caller persists confirmed hits back into the merchant map.
//
// `classifier` is injected so this module is fully testable without the live Claude client.
// Signature: async (txn, { categoryTree }) => { tier1, tier2, merchant, recurring, confident }

import { lookupMerchant } from '../../config/merchant-map.js';
import { lookupItem } from '../../config/item-map.js';
import { isValidCategory, categoryTreeForPrompt } from '../../config/categories.js';

const STRUCTURAL = {
  INTERNAL_TRANSFER: { tier1: 'FINANCIAL OPERATIONS', tier2: 'Internal Transfer: Own Account Move', tag: 'InternalTransfer' },
  TRANSFER_OUT:      { tier1: 'FINANCIAL OPERATIONS', tier2: 'Internal Transfer: Own Account Move', tag: 'InternalTransfer' },
  TRANSFER_IN:       { tier1: 'FINANCIAL OPERATIONS', tier2: 'Internal Transfer: Own Account Move', tag: 'InternalTransfer' },
  CASH_WITHDRAWAL:   { tier1: 'FINANCIAL OPERATIONS', tier2: 'Cash: ATM Withdrawal', tag: 'CashWithdrawal' },
};

function structural(txn) {
  const s = STRUCTURAL[txn.transaction_type];
  if (!s) return null;
  return {
    category_tier1: s.tier1,
    category_tier2: s.tier2,
    merchant_tag: s.tag,
    normalized_desc: s.tag,
    is_recurring: false,
    source: 'structural',
  };
}

/**
 * Categorize one transaction.
 * @returns {{ result, learned }} result = categorization fields to write back;
 *          learned = a merchant-map entry to persist (only when Claude resolved a new merchant)
 */
export async function categorizeTransaction(txn, { classifier } = {}) {
  // 1 — structural, never spends a token
  const struct = structural(txn);
  if (struct) return { result: struct, learned: null };

  // 2 — known merchant
  const known = lookupMerchant(txn.raw_description);
  if (known) return { result: known, learned: null };

  // 2b — known item (grocery/household/street food — never saved to merchant-map)
  const item = lookupItem(txn.raw_description);
  if (item) return { result: item, learned: null };

  // 3 — Claude fallback for genuinely unknown merchants
  if (!classifier) {
    return { result: { ...errorResult(txn), reason: 'unknown_merchant_no_classifier' }, learned: null };
  }

  let ai;
  try {
    ai = await classifier(txn, { categoryTree: categoryTreeForPrompt() });
  } catch (err) {
    return { result: { ...errorResult(txn), reason: `classifier_error: ${err.message}` }, learned: null };
  }

  // Never trust the model blindly — validate against the real tree (the "no guessing" rule).
  if (!ai?.confident || !isValidCategory(ai.tier1, ai.tier2)) {
    return { result: { ...errorResult(txn), reason: 'low_confidence_or_invalid_category' }, learned: null };
  }

  const result = {
    category_tier1: ai.tier1,
    category_tier2: ai.tier2,
    merchant_tag: ai.merchant || 'Unknown',
    normalized_desc: ai.merchant || txn.raw_description,
    is_recurring: Boolean(ai.recurring),
    source: 'claude',
  };

  // Build a merchant-map entry so this merchant is deterministic next time.
  const learned = ai.merchant
    ? { match: ai.merchant.toLowerCase(), tier1: ai.tier1, tier2: ai.tier2, merchant: ai.merchant, recurring: Boolean(ai.recurring) }
    : null;

  return { result, learned };
}

function errorResult(txn) {
  return {
    category_tier1: '',
    category_tier2: '',
    merchant_tag: '',
    normalized_desc: txn.raw_description,
    is_recurring: false,
    flags: 'ERROR',
    source: 'error',
    ai_processed: 'ERROR', // surfaced explicitly in the next report, never silently guessed
  };
}
