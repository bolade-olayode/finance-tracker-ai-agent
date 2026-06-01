// config/categories.js
// The dual-tier category tree from the brief, as structured data.
// Used to (a) validate any tier1/tier2 pair and (b) constrain the Claude fallback
// so it can only ever return a category that actually exists (no invented categories).

export const CATEGORY_TREE = {
  INCOME: [
    'Freelance: Client Payment', 'Freelance: Upwork Disbursement',
    'Salary: Employment', 'Investment: PiggyVest Interest', 'Misc: Refund/Reversal',
  ],
  'FOOD & DINING': [
    'Groceries: Supermarket', 'Groceries: Open Market',
    'Delivery: App-Based', 'Delivery: Direct Restaurant',
    'Eating Out: Restaurant/Eatery', 'Eating Out: Fast Food', 'Beverages: Drinks/Snacks',
  ],
  TRANSPORT: [
    'Ride-Hailing: Bolt', 'Ride-Hailing: Uber', 'Ride-Hailing: InDrive',
    'Public: Danfo/BRT', 'Public: Okada/Tricycle',
    'Fuel: Personal Vehicle', 'Maintenance: Vehicle Service', 'Intercity: Bus/Train/Flight',
  ],
  'UTILITIES & BILLS': [
    'Electricity: NEPA/BEDC Prepaid', 'Internet: Home Broadband',
    'Internet: Mobile Data', 'Water: Water Bill', 'Gas: Cooking Gas',
  ],
  SUBSCRIPTIONS: [
    'Entertainment: Netflix', 'Entertainment: Showmax/DSTV', 'Entertainment: Spotify',
    'Productivity: Software/SaaS', 'Cloud: Hosting/Storage',
    'Professional: Upwork Connects', 'Misc: Other Recurring',
  ],
  'HEALTH & WELLNESS': [
    'Medical: Pharmacy', 'Medical: Hospital', 'Fitness: Gym', 'Fitness: Running Gear',
    'Grooming: Barber/Salon', 'Personal Care: Toiletries',
  ],
  'HOUSING & MAINTENANCE': [
    'Rent: Monthly/Annual', 'Repairs: Home Maintenance',
    'Furnishing: Home Items', 'Security: Estate Fees',
  ],
  'SHOPPING & LIFESTYLE': [
    'Clothing: Apparel/Footwear', 'Electronics: Gadgets',
    'Books: Physical/Digital', 'Misc: Jumia/Jiji Shopping',
  ],
  'FINANCIAL OPERATIONS': [
    'Fees: Bank Transfer (NIP)', 'Fees: Stamp Duty', 'Fees: ATM Withdrawal',
    'Fees: USSD Charge', 'Fees: SMS Alert',
    'Savings: PiggyVest Target Deposit',
    'Internal Transfer: Own Account Move', 'Cash: ATM Withdrawal',
  ],
  'BUSINESS & PROFESSIONAL': [
    'Tools: Dev Software/Licenses', 'Infrastructure: Hosting/Domains',
    'Marketing: Ads/Promotion', 'Education: Courses/Certs', 'Misc: Business Expenses',
  ],
  'FAMILY & SOCIAL': [
    'Support: Family Transfer/Gift', 'Social: Events/Outings',
    'Giving: Church/Charity/Tithe', 'Misc: Celebrations',
  ],
  'LOANS & LIABILITIES': [
    'Loan: Borrowed (Received)', 'Loan: Repayment (Sent)',
    'Loan: Opay Credit', 'Loan: Carbon/FairMoney', 'Loan: Owed to Person',
  ],
};

// Flat set of valid "Tier1||Tier2" keys for O(1) validation.
const VALID = new Set(
  Object.entries(CATEGORY_TREE).flatMap(([t1, list]) => list.map((t2) => `${t1}||${t2}`)),
);

export const isValidCategory = (tier1, tier2) => VALID.has(`${tier1}||${tier2}`);

// Compact representation handed to the Claude fallback so it picks from the real tree.
export const categoryTreeForPrompt = () =>
  Object.entries(CATEGORY_TREE)
    .map(([t1, list]) => `${t1}:\n  ${list.join('\n  ')}`)
    .join('\n');
