// config/accounts.js
// Mirror of the ACCOUNTS_REGISTRY sheet. Code reads from here for fee logic and
// burn-rate inclusion so it never has to guess. Keep in sync with Sheet 5.

export const ACCOUNTS = {
  'ACC-01': {
    bank: 'Access',
    type: 'Current',
    nickname: 'Access Main',
    role: 'SPENDING',
    currency: 'NGN',
    includeInBurnRate: true,
    provider: 'bank',        // 'bank' = CBN-tiered transfer fee applies; 'fintech' = own fee may differ
  },
  'ACC-02': {
    bank: 'Opay',
    type: 'Wallet',
    nickname: 'Opay Wallet',
    role: 'SPENDING',
    currency: 'NGN',
    includeInBurnRate: true,
    provider: 'fintech',     // zero own-transfer fee (see config/fees.js)
  },
  'ACC-03': {
    bank: 'Zenith',
    type: 'Current',
    nickname: 'Zenith',
    role: 'SPENDING',
    currency: 'NGN',
    includeInBurnRate: true,
    provider: 'bank',
  },
  'ACC-04': {
    bank: 'Fidelity',
    type: 'Current',
    nickname: 'Fidelity',
    role: 'SPENDING',
    currency: 'NGN',
    includeInBurnRate: true,
    provider: 'bank',
  },
  'ACC-05': {
    bank: 'PiggyVest',
    type: 'Savings',
    nickname: 'PiggyVest',
    role: 'SAVINGS',
    currency: 'NGN',
    includeInBurnRate: false, // excluded from burn rate by design
    provider: 'savings',
  },
  'CASH': {
    bank: 'Cash',
    type: 'Cash',
    nickname: 'Physical Cash',
    role: 'SPENDING',
    currency: 'NGN',
    includeInBurnRate: true,
    provider: 'cash',
  },
};

export const SPENDING_ACCOUNTS = Object.entries(ACCOUNTS)
  .filter(([, a]) => a.includeInBurnRate)
  .map(([id]) => id);

export const isSpending = (accountId) => ACCOUNTS[accountId]?.includeInBurnRate === true;
