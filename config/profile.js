// config/profile.js
// The two pending items from the brief live here. Drop real values in — nothing else
// in the engine needs to change. Interest accrual + on-track logic read from here.

export const PROFILE = {
  // PENDING #2 — which account receives salary / Upwork disbursements?
  primaryIncomeAccount: 'ACC-01', // TODO: confirm (ACC-01..ACC-04)

  savingsRateTargetPct: 30, // personal benchmark used in reports; tune freely
};

// PENDING #1 — the 3 PiggyVest Target Savings plans. Names + numbers to confirm.
// interestRatePa: confirm actual PiggyVest Target Savings rate (placeholder 10%).
export const TARGETS = [
  {
    id: 'TGT-001', nickname: 'TARGET 1 (TBD)',
    goalAmount: 0, currentBalance: 0, monthlyContribution: 0,
    interestRatePa: 0.10, startDate: null, targetDate: null,
    withdrawalType: 'FLEXIBLE', status: 'ACTIVE',
  },
  {
    id: 'TGT-002', nickname: 'TARGET 2 (TBD)',
    goalAmount: 0, currentBalance: 0, monthlyContribution: 0,
    interestRatePa: 0.10, startDate: null, targetDate: null,
    withdrawalType: 'FLEXIBLE', status: 'ACTIVE',
  },
  {
    id: 'TGT-003', nickname: 'TARGET 3 (TBD)',
    goalAmount: 0, currentBalance: 0, monthlyContribution: 0,
    interestRatePa: 0.10, startDate: null, targetDate: null,
    withdrawalType: 'FLEXIBLE', status: 'ACTIVE',
  },
];
