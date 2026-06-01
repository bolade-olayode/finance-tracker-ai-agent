// config/merchant-map.js
// The heart of "rules-first". Known merchants resolve instantly with ZERO API calls.
// Each entry: keyword(s) that appear in raw_description -> deterministic categorization.
// When the Claude fallback resolves a brand-new merchant, the engine appends it here
// (persisted to disk) so it's deterministic forever after. The map self-improves.
//
// `match` is matched case-insensitively as a substring of the raw description.

export const SEED_MERCHANTS = [
  // FOOD & DINING
  { match: 'chowdeck', tier1: 'FOOD & DINING', tier2: 'Delivery: App-Based', merchant: 'Chowdeck', recurring: false },
  { match: 'glovo', tier1: 'FOOD & DINING', tier2: 'Delivery: App-Based', merchant: 'Glovo', recurring: false },
  { match: 'bolt food', tier1: 'FOOD & DINING', tier2: 'Delivery: App-Based', merchant: 'Bolt Food', recurring: false },
  { match: 'shoprite', tier1: 'FOOD & DINING', tier2: 'Groceries: Supermarket', merchant: 'Shoprite', recurring: false },
  { match: 'spar', tier1: 'FOOD & DINING', tier2: 'Groceries: Supermarket', merchant: 'Spar', recurring: false },

  // TRANSPORT (note: 'bolt food' is matched before 'bolt' by ordering below)
  { match: 'uber', tier1: 'TRANSPORT', tier2: 'Ride-Hailing: Uber', merchant: 'Uber', recurring: false },
  { match: 'indrive', tier1: 'TRANSPORT', tier2: 'Ride-Hailing: InDrive', merchant: 'InDrive', recurring: false },
  { match: 'bolt', tier1: 'TRANSPORT', tier2: 'Ride-Hailing: Bolt', merchant: 'Bolt', recurring: false },

  // UTILITIES
  { match: 'ikedc', tier1: 'UTILITIES & BILLS', tier2: 'Electricity: NEPA/BEDC Prepaid', merchant: 'IKEDC', recurring: true },
  { match: 'ibedc', tier1: 'UTILITIES & BILLS', tier2: 'Electricity: NEPA/BEDC Prepaid', merchant: 'IBEDC', recurring: true },
  { match: 'mtn', tier1: 'UTILITIES & BILLS', tier2: 'Internet: Mobile Data', merchant: 'MTN', recurring: true },
  { match: 'airtel', tier1: 'UTILITIES & BILLS', tier2: 'Internet: Mobile Data', merchant: 'Airtel', recurring: true },
  { match: 'spectranet', tier1: 'UTILITIES & BILLS', tier2: 'Internet: Home Broadband', merchant: 'Spectranet', recurring: true },

  // SUBSCRIPTIONS
  { match: 'netflix', tier1: 'SUBSCRIPTIONS', tier2: 'Entertainment: Netflix', merchant: 'Netflix', recurring: true },
  { match: 'spotify', tier1: 'SUBSCRIPTIONS', tier2: 'Entertainment: Spotify', merchant: 'Spotify', recurring: true },
  { match: 'dstv', tier1: 'SUBSCRIPTIONS', tier2: 'Entertainment: Showmax/DSTV', merchant: 'DSTV', recurring: true },

  // BUSINESS
  { match: 'upwork', tier1: 'INCOME', tier2: 'Freelance: Upwork Disbursement', merchant: 'Upwork', recurring: false },
  { match: 'hostinger', tier1: 'BUSINESS & PROFESSIONAL', tier2: 'Infrastructure: Hosting/Domains', merchant: 'Hostinger', recurring: true },
  { match: 'whogohost', tier1: 'BUSINESS & PROFESSIONAL', tier2: 'Infrastructure: Hosting/Domains', merchant: 'WhoGoHost', recurring: true },
];

// Longest match first so 'bolt food' wins over 'bolt'.
const ordered = [...SEED_MERCHANTS].sort((a, b) => b.match.length - a.match.length);

export function lookupMerchant(rawDescription = '') {
  const hay = rawDescription.toLowerCase();
  const hit = ordered.find((m) => hay.includes(m.match));
  if (!hit) return null;
  return {
    category_tier1: hit.tier1,
    category_tier2: hit.tier2,
    merchant_tag: hit.merchant,
    normalized_desc: hit.merchant,
    is_recurring: hit.recurring,
    source: 'merchant-map',
  };
}
