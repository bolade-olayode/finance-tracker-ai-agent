// config/item-map.js
// Common Nigerian grocery / household items that appear as raw descriptions (not merchant names).
// Resolves instantly — zero API calls. Marked type:'item' so the engine never saves these
// to the learned merchant-map (items are not merchants).
//
// `match` is case-insensitive substring of raw_description.

export const ITEM_MAP = [
  // ── Beverages & Drinks ───────────────────────────────────────────────────
  { match: 'energy drink', tier1: 'FOOD & DINING', tier2: 'Beverages: Drinks/Snacks', item: 'Energy Drink' },
  { match: 'monster',     tier1: 'FOOD & DINING', tier2: 'Beverages: Drinks/Snacks', item: 'Monster' },
  { match: 'redbull',     tier1: 'FOOD & DINING', tier2: 'Beverages: Drinks/Snacks', item: 'Red Bull' },
  { match: 'red bull',    tier1: 'FOOD & DINING', tier2: 'Beverages: Drinks/Snacks', item: 'Red Bull' },
  { match: 'soda',        tier1: 'FOOD & DINING', tier2: 'Beverages: Drinks/Snacks', item: 'Soda' },
  { match: 'coke',        tier1: 'FOOD & DINING', tier2: 'Beverages: Drinks/Snacks', item: 'Coke' },
  { match: 'fanta',       tier1: 'FOOD & DINING', tier2: 'Beverages: Drinks/Snacks', item: 'Fanta' },
  { match: 'pepsi',       tier1: 'FOOD & DINING', tier2: 'Beverages: Drinks/Snacks', item: 'Pepsi' },
  { match: 'lacasera',    tier1: 'FOOD & DINING', tier2: 'Beverages: Drinks/Snacks', item: 'La Casera' },
  { match: 'malta',       tier1: 'FOOD & DINING', tier2: 'Beverages: Drinks/Snacks', item: 'Malt' },
  { match: 'malt',        tier1: 'FOOD & DINING', tier2: 'Beverages: Drinks/Snacks', item: 'Malt' },
  { match: 'zobo',        tier1: 'FOOD & DINING', tier2: 'Beverages: Drinks/Snacks', item: 'Zobo' },
  { match: 'chapman',     tier1: 'FOOD & DINING', tier2: 'Beverages: Drinks/Snacks', item: 'Chapman' },
  { match: 'juice',       tier1: 'FOOD & DINING', tier2: 'Beverages: Drinks/Snacks', item: 'Juice' },
  { match: 'water',       tier1: 'FOOD & DINING', tier2: 'Beverages: Drinks/Snacks', item: 'Water' },
  { match: 'beer',        tier1: 'FOOD & DINING', tier2: 'Beverages: Drinks/Snacks', item: 'Beer' },
  { match: 'guinness',    tier1: 'FOOD & DINING', tier2: 'Beverages: Drinks/Snacks', item: 'Guinness' },
  { match: 'snack',       tier1: 'FOOD & DINING', tier2: 'Beverages: Drinks/Snacks', item: 'Snacks' },
  { match: 'biscuit',     tier1: 'FOOD & DINING', tier2: 'Beverages: Drinks/Snacks', item: 'Biscuit' },
  { match: 'chocolate',   tier1: 'FOOD & DINING', tier2: 'Beverages: Drinks/Snacks', item: 'Chocolate' },
  { match: 'sweet',       tier1: 'FOOD & DINING', tier2: 'Beverages: Drinks/Snacks', item: 'Sweets' },
  { match: 'candy',       tier1: 'FOOD & DINING', tier2: 'Beverages: Drinks/Snacks', item: 'Candy' },

  // ── Open Market Staples ──────────────────────────────────────────────────
  { match: 'egg',         tier1: 'FOOD & DINING', tier2: 'Groceries: Open Market', item: 'Eggs' },
  { match: 'rice',        tier1: 'FOOD & DINING', tier2: 'Groceries: Open Market', item: 'Rice' },
  { match: 'beans',       tier1: 'FOOD & DINING', tier2: 'Groceries: Open Market', item: 'Beans' },
  { match: 'yam',         tier1: 'FOOD & DINING', tier2: 'Groceries: Open Market', item: 'Yam' },
  { match: 'plantain',    tier1: 'FOOD & DINING', tier2: 'Groceries: Open Market', item: 'Plantain' },
  { match: 'tomato',      tier1: 'FOOD & DINING', tier2: 'Groceries: Open Market', item: 'Tomatoes' },
  { match: 'pepper',      tier1: 'FOOD & DINING', tier2: 'Groceries: Open Market', item: 'Pepper' },
  { match: 'onion',       tier1: 'FOOD & DINING', tier2: 'Groceries: Open Market', item: 'Onions' },
  { match: 'garlic',      tier1: 'FOOD & DINING', tier2: 'Groceries: Open Market', item: 'Garlic' },
  { match: 'potato',      tier1: 'FOOD & DINING', tier2: 'Groceries: Open Market', item: 'Potatoes' },
  { match: 'carrot',      tier1: 'FOOD & DINING', tier2: 'Groceries: Open Market', item: 'Carrots' },
  { match: 'spinach',     tier1: 'FOOD & DINING', tier2: 'Groceries: Open Market', item: 'Spinach' },
  { match: 'ugu',         tier1: 'FOOD & DINING', tier2: 'Groceries: Open Market', item: 'Ugu' },
  { match: 'ewedu',       tier1: 'FOOD & DINING', tier2: 'Groceries: Open Market', item: 'Ewedu' },
  { match: 'okra',        tier1: 'FOOD & DINING', tier2: 'Groceries: Open Market', item: 'Okra' },
  { match: 'ginger',      tier1: 'FOOD & DINING', tier2: 'Groceries: Open Market', item: 'Ginger' },
  { match: 'fish',        tier1: 'FOOD & DINING', tier2: 'Groceries: Open Market', item: 'Fish' },
  { match: 'chicken',     tier1: 'FOOD & DINING', tier2: 'Groceries: Open Market', item: 'Chicken' },
  { match: 'beef',        tier1: 'FOOD & DINING', tier2: 'Groceries: Open Market', item: 'Beef' },
  { match: 'meat',        tier1: 'FOOD & DINING', tier2: 'Groceries: Open Market', item: 'Meat' },
  { match: 'turkey',      tier1: 'FOOD & DINING', tier2: 'Groceries: Open Market', item: 'Turkey' },
  { match: 'titus',       tier1: 'FOOD & DINING', tier2: 'Groceries: Open Market', item: 'Titus Fish' },
  { match: 'stockfish',   tier1: 'FOOD & DINING', tier2: 'Groceries: Open Market', item: 'Stockfish' },
  { match: 'crayfish',    tier1: 'FOOD & DINING', tier2: 'Groceries: Open Market', item: 'Crayfish' },
  { match: 'palm oil',    tier1: 'FOOD & DINING', tier2: 'Groceries: Open Market', item: 'Palm Oil' },
  { match: 'groundnut oil', tier1: 'FOOD & DINING', tier2: 'Groceries: Open Market', item: 'Groundnut Oil' },
  { match: 'salt',        tier1: 'FOOD & DINING', tier2: 'Groceries: Open Market', item: 'Salt' },
  { match: 'seasoning',   tier1: 'FOOD & DINING', tier2: 'Groceries: Open Market', item: 'Seasoning' },
  { match: 'maggi',       tier1: 'FOOD & DINING', tier2: 'Groceries: Open Market', item: 'Maggi' },
  { match: 'knorr',       tier1: 'FOOD & DINING', tier2: 'Groceries: Open Market', item: 'Knorr' },
  { match: 'bread',       tier1: 'FOOD & DINING', tier2: 'Groceries: Open Market', item: 'Bread' },

  // ── Packaged Grocery ─────────────────────────────────────────────────────
  { match: 'noodle',      tier1: 'FOOD & DINING', tier2: 'Groceries: Supermarket', item: 'Noodles' },
  { match: 'indomie',     tier1: 'FOOD & DINING', tier2: 'Groceries: Supermarket', item: 'Indomie' },
  { match: 'spaghetti',   tier1: 'FOOD & DINING', tier2: 'Groceries: Supermarket', item: 'Spaghetti' },
  { match: 'pasta',       tier1: 'FOOD & DINING', tier2: 'Groceries: Supermarket', item: 'Pasta' },
  { match: 'oats',        tier1: 'FOOD & DINING', tier2: 'Groceries: Supermarket', item: 'Oats' },
  { match: 'cereal',      tier1: 'FOOD & DINING', tier2: 'Groceries: Supermarket', item: 'Cereal' },
  { match: 'milk',        tier1: 'FOOD & DINING', tier2: 'Groceries: Supermarket', item: 'Milk' },
  { match: 'milo',        tier1: 'FOOD & DINING', tier2: 'Groceries: Supermarket', item: 'Milo' },
  { match: 'ovaltine',    tier1: 'FOOD & DINING', tier2: 'Groceries: Supermarket', item: 'Ovaltine' },
  { match: 'flour',       tier1: 'FOOD & DINING', tier2: 'Groceries: Supermarket', item: 'Flour' },
  { match: 'sugar',       tier1: 'FOOD & DINING', tier2: 'Groceries: Supermarket', item: 'Sugar' },
  { match: 'tin tomato',  tier1: 'FOOD & DINING', tier2: 'Groceries: Supermarket', item: 'Tin Tomato' },
  { match: 'sardine',     tier1: 'FOOD & DINING', tier2: 'Groceries: Supermarket', item: 'Sardines' },
  { match: 'tuna',        tier1: 'FOOD & DINING', tier2: 'Groceries: Supermarket', item: 'Tuna' },
  { match: 'cornflakes',  tier1: 'FOOD & DINING', tier2: 'Groceries: Supermarket', item: 'Cornflakes' },

  // ── Street Food / Fast Food ──────────────────────────────────────────────
  { match: 'suya',        tier1: 'FOOD & DINING', tier2: 'Eating Out: Fast Food', item: 'Suya' },
  { match: 'shawarma',    tier1: 'FOOD & DINING', tier2: 'Eating Out: Fast Food', item: 'Shawarma' },
  { match: 'puff puff',   tier1: 'FOOD & DINING', tier2: 'Eating Out: Fast Food', item: 'Puff Puff' },
  { match: 'akara',       tier1: 'FOOD & DINING', tier2: 'Eating Out: Fast Food', item: 'Akara' },
  { match: 'moi moi',     tier1: 'FOOD & DINING', tier2: 'Eating Out: Fast Food', item: 'Moi Moi' },
  { match: 'boli',        tier1: 'FOOD & DINING', tier2: 'Eating Out: Fast Food', item: 'Boli' },
  { match: 'roasted corn', tier1: 'FOOD & DINING', tier2: 'Eating Out: Fast Food', item: 'Roasted Corn' },
  { match: 'corn',        tier1: 'FOOD & DINING', tier2: 'Eating Out: Fast Food', item: 'Corn' },
  { match: 'jollof',      tier1: 'FOOD & DINING', tier2: 'Eating Out: Fast Food', item: 'Jollof Rice' },
  { match: 'fried rice',  tier1: 'FOOD & DINING', tier2: 'Eating Out: Fast Food', item: 'Fried Rice' },
  { match: 'chips',       tier1: 'FOOD & DINING', tier2: 'Eating Out: Fast Food', item: 'Chips' },
  { match: 'sandwich',    tier1: 'FOOD & DINING', tier2: 'Eating Out: Fast Food', item: 'Sandwich' },
  { match: 'burger',      tier1: 'FOOD & DINING', tier2: 'Eating Out: Fast Food', item: 'Burger' },
  { match: 'pizza',       tier1: 'FOOD & DINING', tier2: 'Eating Out: Fast Food', item: 'Pizza' },

  // ── Personal Care & Toiletries ───────────────────────────────────────────
  { match: 'soap',        tier1: 'HEALTH & WELLNESS', tier2: 'Personal Care: Toiletries', item: 'Soap' },
  { match: 'toothpaste',  tier1: 'HEALTH & WELLNESS', tier2: 'Personal Care: Toiletries', item: 'Toothpaste' },
  { match: 'toothbrush',  tier1: 'HEALTH & WELLNESS', tier2: 'Personal Care: Toiletries', item: 'Toothbrush' },
  { match: 'shampoo',     tier1: 'HEALTH & WELLNESS', tier2: 'Personal Care: Toiletries', item: 'Shampoo' },
  { match: 'cream',       tier1: 'HEALTH & WELLNESS', tier2: 'Personal Care: Toiletries', item: 'Cream' },
  { match: 'lotion',      tier1: 'HEALTH & WELLNESS', tier2: 'Personal Care: Toiletries', item: 'Lotion' },
  { match: 'deodorant',   tier1: 'HEALTH & WELLNESS', tier2: 'Personal Care: Toiletries', item: 'Deodorant' },
  { match: 'perfume',     tier1: 'HEALTH & WELLNESS', tier2: 'Personal Care: Toiletries', item: 'Perfume' },
  { match: 'tissue',      tier1: 'HEALTH & WELLNESS', tier2: 'Personal Care: Toiletries', item: 'Tissue' },
  { match: 'pad',         tier1: 'HEALTH & WELLNESS', tier2: 'Personal Care: Toiletries', item: 'Sanitary Pad' },
  { match: 'tampon',      tier1: 'HEALTH & WELLNESS', tier2: 'Personal Care: Toiletries', item: 'Tampon' },
  { match: 'razor',       tier1: 'HEALTH & WELLNESS', tier2: 'Personal Care: Toiletries', item: 'Razor' },

  // ── Household ────────────────────────────────────────────────────────────
  { match: 'detergent',   tier1: 'HOUSING & MAINTENANCE', tier2: 'Repairs: Home Maintenance', item: 'Detergent' },
  { match: 'bleach',      tier1: 'HOUSING & MAINTENANCE', tier2: 'Repairs: Home Maintenance', item: 'Bleach' },
  { match: 'broom',       tier1: 'HOUSING & MAINTENANCE', tier2: 'Repairs: Home Maintenance', item: 'Broom' },
  { match: 'bucket',      tier1: 'HOUSING & MAINTENANCE', tier2: 'Furnishing: Home Items', item: 'Bucket' },
  { match: 'candle',      tier1: 'HOUSING & MAINTENANCE', tier2: 'Repairs: Home Maintenance', item: 'Candles' },
  { match: 'charcoal',    tier1: 'UTILITIES & BILLS', tier2: 'Gas: Cooking Gas', item: 'Charcoal' },

  // ── Transport ────────────────────────────────────────────────────────────
  { match: 'fuel',        tier1: 'TRANSPORT', tier2: 'Fuel: Personal Vehicle', item: 'Fuel' },
  { match: 'petrol',      tier1: 'TRANSPORT', tier2: 'Fuel: Personal Vehicle', item: 'Petrol' },
  { match: 'danfo',       tier1: 'TRANSPORT', tier2: 'Public: Danfo/BRT', item: 'Danfo' },
  { match: 'brt',         tier1: 'TRANSPORT', tier2: 'Public: Danfo/BRT', item: 'BRT' },
  { match: 'okada',       tier1: 'TRANSPORT', tier2: 'Public: Okada/Tricycle', item: 'Okada' },
  { match: 'keke',        tier1: 'TRANSPORT', tier2: 'Public: Okada/Tricycle', item: 'Keke' },
  { match: 'tricycle',    tier1: 'TRANSPORT', tier2: 'Public: Okada/Tricycle', item: 'Tricycle' },
  { match: 'bus fare',    tier1: 'TRANSPORT', tier2: 'Public: Danfo/BRT', item: 'Bus Fare' },
  { match: 'transport',   tier1: 'TRANSPORT', tier2: 'Public: Danfo/BRT', item: 'Transport' },

  // ── Utilities ────────────────────────────────────────────────────────────
  { match: 'cooking gas', tier1: 'UTILITIES & BILLS', tier2: 'Gas: Cooking Gas', item: 'Cooking Gas' },
  { match: 'gas refill',  tier1: 'UTILITIES & BILLS', tier2: 'Gas: Cooking Gas', item: 'Cooking Gas' },
  { match: 'airtime',     tier1: 'UTILITIES & BILLS', tier2: 'Internet: Mobile Data', item: 'Airtime' },
  { match: 'data',        tier1: 'UTILITIES & BILLS', tier2: 'Internet: Mobile Data', item: 'Data' },

  // ── Pharmacy / Health ────────────────────────────────────────────────────
  { match: 'drug',        tier1: 'HEALTH & WELLNESS', tier2: 'Medical: Pharmacy', item: 'Drugs' },
  { match: 'medicine',    tier1: 'HEALTH & WELLNESS', tier2: 'Medical: Pharmacy', item: 'Medicine' },
  { match: 'paracetamol', tier1: 'HEALTH & WELLNESS', tier2: 'Medical: Pharmacy', item: 'Paracetamol' },
  { match: 'ibuprofen',   tier1: 'HEALTH & WELLNESS', tier2: 'Medical: Pharmacy', item: 'Ibuprofen' },
  { match: 'vitamin',     tier1: 'HEALTH & WELLNESS', tier2: 'Medical: Pharmacy', item: 'Vitamins' },
  { match: 'supplement',  tier1: 'HEALTH & WELLNESS', tier2: 'Medical: Pharmacy', item: 'Supplement' },
];

// Longest match wins (e.g. 'cooking gas' beats 'gas', 'tin tomato' beats 'tomato').
const ordered = [...ITEM_MAP].sort((a, b) => b.match.length - a.match.length);

export function lookupItem(rawDescription = '') {
  const hay = rawDescription.toLowerCase();
  const hit = ordered.find((i) => hay.includes(i.match));
  if (!hit) return null;
  return {
    category_tier1: hit.tier1,
    category_tier2: hit.tier2,
    merchant_tag: hit.item,
    normalized_desc: hit.item,
    is_recurring: false,
    source: 'item-map',   // distinguishes from 'merchant-map' — never written to learned map
  };
}
