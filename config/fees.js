// config/fees.js
// Nigerian transfer/withdrawal fee model, current as of 2026 (Nigeria Tax Act 2025 + CBN guide).
// Encoded as DATA so it's trivially updatable when CBN changes the rules again.
//
// What changed in 2026 (why the old brief's flat "₦10 + VAT" is wrong):
//  • Stamp duty (formerly EMTL): ₦50 on transfers >= ₦10,000, now paid by the SENDER
//    (previously deducted from the receiver). Salary + intra-bank self-transfers are exempt.
//  • CBN base transfer fee is now tiered (see TRANSFER_FEE_TIERS).
//  • ATM/PoS withdrawals: ₦100 per ₦20,000 withdrawn.
// Fintech (Opay) own-transfer fee remains ₦0 — but stamp duty still applies on ₦10k+,
// so "route via Opay to save" only avoids the CBN tier fee, NOT the stamp duty.

export const STAMP_DUTY = {
  amount: 50,
  threshold: 10000,                       // applies to transfers >= this
  exemptTransactionTypes: ['INTERNAL_TRANSFER', 'TRANSFER_IN', 'TRANSFER_OUT'], // own-account self moves
  exemptCategories: ['Salary: Employment'], // salary credits exempt
  note: 'Stamp duty (ex-EMTL), ₦50 on transfers ≥₦10k, borne by sender (2026).',
};

// CBN tiered transfer fee — applies to BANK-provider outbound transfers.
export const TRANSFER_FEE_TIERS = [
  { maxAmount: 5000, fee: 10 },           // < ₦5,000
  { maxAmount: 50000, fee: 25 },          // ₦5,001 – ₦50,000
  { maxAmount: Infinity, fee: 50 },       // > ₦50,000
];

// Fintech providers with zero own-transfer fee.
export const FINTECH_ZERO_TRANSFER = ['fintech'];

// ATM / PoS cash withdrawal: ₦100 per ₦20,000 (or part thereof).
export const WITHDRAWAL_FEE = { perBlock: 100, blockSize: 20000 };

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

// Base CBN transfer fee for the provider type.
function baseTransferFee(amount, provider) {
  if (FINTECH_ZERO_TRANSFER.includes(provider)) return 0;
  const tier = TRANSFER_FEE_TIERS.find((t) => amount <= t.maxAmount);
  return tier ? tier.fee : 0;
}

// Stamp duty component for a transaction.
function stampDuty(amount, transactionType, categoryTier2) {
  if (amount < STAMP_DUTY.threshold) return 0;
  if (STAMP_DUTY.exemptTransactionTypes.includes(transactionType)) return 0;
  if (categoryTier2 && STAMP_DUTY.exemptCategories.includes(categoryTier2)) return 0;
  return STAMP_DUTY.amount;
}

/**
 * Total cost of an outbound transfer.
 * @returns {{ base:number, stamp:number, total:number, avoidableViaOpay:number }}
 *   avoidableViaOpay = the portion that would disappear if this had gone through Opay
 *   (the CBN tier fee only — stamp duty is unavoidable across institutions).
 */
export function calcTransferCost({ amount, provider, transactionType, categoryTier2 }) {
  const base = baseTransferFee(amount, provider);
  const stamp = stampDuty(amount, transactionType, categoryTier2);
  const avoidableViaOpay = FINTECH_ZERO_TRANSFER.includes(provider) ? 0 : base;
  return {
    base: round2(base),
    stamp: round2(stamp),
    total: round2(base + stamp),
    avoidableViaOpay: round2(avoidableViaOpay),
  };
}

/** Cost of an ATM/PoS cash withdrawal of `amount`. */
export function calcWithdrawalCost(amount) {
  const blocks = Math.ceil(amount / WITHDRAWAL_FEE.blockSize);
  return round2(blocks * WITHDRAWAL_FEE.perBlock);
}
