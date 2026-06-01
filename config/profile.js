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
  { id: 'TGT-001', nickname: 'Running Gears',       goalAmount: 700000,  currentBalance: 3650,
    monthlyContribution: 0, interestRatePa: 0.10, targetDate: '2027-01-15', status: 'ACTIVE' },
  { id: 'TGT-002', nickname: 'Rainy Days',           goalAmount: 2000000, currentBalance: 8000,
    monthlyContribution: 0, interestRatePa: 0.10, targetDate: '2027-01-30', status: 'ACTIVE' },
  { id: 'TGT-003', nickname: 'YouTube Views Match',  goalAmount: 3000000, currentBalance: 9600,
    monthlyContribution: 0, interestRatePa: 0.10, targetDate: '2027-02-23', status: 'ACTIVE' },
];
