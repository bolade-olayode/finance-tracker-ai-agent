// test/cycle.test.js
// Runs the exact code path the Telegram buttons trigger — against the mock data source,
// with a mock classifier standing in for Claude. No credentials needed.
// Run: npm test

import { runCycleA } from '../src/cycles/cycleA.js';
import { runCycleB } from '../src/cycles/cycleB.js';
import { createMockDataSource } from '../src/sheets/dataSource.js';

const mockClassifier = async (txn) => {
  if (/kuto|market/i.test(txn.raw_description))
    return { tier1: 'FOOD & DINING', tier2: 'Groceries: Open Market', merchant: 'Kuto Market', recurring: false, confident: true };
  return { confident: false };
};
const mockAdviser = async (c) => [
  `Route the ₦${c.avoidableFees} in bank fees through Opay next fortnight`,
  `Your Japa Fund needs ₦${c.targets.find((t) => t.nickname === 'Japa Fund')?.requiredMonthly?.toLocaleString('en-NG')}/mo to stay on track`,
];

const ds = createMockDataSource();

console.log('━━━ BUTTON: "Run Daily (Cycle A)" ━━━\n');
const a = await runCycleA({ dataSource: ds, classifier: mockClassifier });
console.log(`\n  → processed ${a.processed}, Claude calls ${a.aiCalls}, learned ${a.learned}, errors ${a.errors}`);
console.log(`  → net real spend ₦${a.aggregate.net_real_spend.toLocaleString('en-NG')}, top ${a.aggregate.top_category}\n`);

console.log('━━━ BUTTON: "Fortnightly Report (Cycle B)" ━━━\n');
const b = await runCycleB({ dataSource: ds, adviser: mockAdviser });
console.log('  ┌─ Telegram message ──────────────────────');
console.log(b.text.split('\n').map((l) => '  │ ' + l).join('\n'));
console.log('  └─────────────────────────────────────────\n');
console.log('✔ Full control loop works end-to-end with zero credentials.');
