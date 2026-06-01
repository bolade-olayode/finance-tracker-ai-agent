// src/ai/claude.js
// Claude's ONLY two jobs: (1) classify a merchant the rules engine has never seen,
// (2) write the fortnightly advice narrative. It never does arithmetic.
//
// Models (verified current):
//   classify -> claude-haiku-4-5  (fast + cheap, high volume, the daily fallback)
//   analyze  -> claude-sonnet-4-6 (reasoning quality for the fortnightly report)

import Anthropic from '@anthropic-ai/sdk';

let _client;
const client = () => (_client ||= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }));
const MODEL_CLASSIFY = process.env.CLAUDE_MODEL_CLASSIFY || 'claude-haiku-4-5';
const MODEL_ANALYZE = process.env.CLAUDE_MODEL_ANALYZE || 'claude-sonnet-4-6';

function extractText(msg) {
  return (msg.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
}
function parseJson(text) {
  const clean = text.replace(/^```json\s*|\s*```$/g, '').trim();
  return JSON.parse(clean);
}

/**
 * classifyMerchant — injected into categorize.js as the fallback `classifier`.
 * Returns { tier1, tier2, merchant, recurring, confident }. Must pick from the real tree.
 */
export async function classifyMerchant(txn, { categoryTree }) {
  const system = [
    'You categorize a single Nigerian bank transaction into a fixed two-tier taxonomy.',
    'You MUST pick a tier1 and tier2 that appear EXACTLY in the provided tree. Do not invent categories.',
    'If you cannot tell with reasonable confidence, set "confident": false and leave the rest blank.',
    'Reply with ONLY a JSON object, no prose, no markdown fences.',
  ].join(' ');

  const user = [
    `CATEGORY TREE (tier1 -> tier2 options):\n${categoryTree}`,
    '',
    'TRANSACTION:',
    `  raw_description: ${txn.raw_description}`,
    `  amount: ₦${txn.amount}`,
    `  channel: ${txn.channel}`,
    `  type: ${txn.type} / ${txn.transaction_type}`,
    '',
    'Return JSON: {"tier1": "...", "tier2": "...", "merchant": "Short Merchant Name", "recurring": true|false, "confident": true|false}',
  ].join('\n');

  const msg = await client().messages.create({
    model: MODEL_CLASSIFY,
    max_tokens: 200,
    system,
    messages: [{ role: 'user', content: user }],
  });

  try {
    const out = parseJson(extractText(msg));
    return {
      tier1: out.tier1, tier2: out.tier2,
      merchant: out.merchant, recurring: Boolean(out.recurring),
      confident: Boolean(out.confident),
    };
  } catch {
    return { confident: false }; // unparseable -> engine flags ERROR, never guesses
  }
}

/**
 * parseEntry — converts a free-text note into a structured transaction.
 * e.g. "energy drink 500" → { direction:'out', amount:500, description:'energy drink', ... }
 */
export async function parseEntry(text) {
  const system = [
    'You parse ONE short personal-finance note from a Nigerian user into a transaction.',
    'Direction is "out" (spending) by default; use "in" for money received — words like got, received, from, paid me, salary, refund, gift, sent me.',
    'amount is a number: "1.5k"=1500, "3,500"=3500, "2k"=2000.',
    'description: a short clean label. account: one of opay, access, zenith, fidelity, cash if mentioned, else null.',
    'If the text is not a transaction, set confident=false.',
    'Reply with ONLY a JSON object — no prose, no markdown fences.',
  ].join(' ');

  const user = `NOTE: "${text}"\nReturn JSON: {"direction":"in|out","amount":number,"description":"...","account":"opay|access|zenith|fidelity|cash|null","confident":true|false}`;

  const msg = await client().messages.create({
    model: MODEL_CLASSIFY,
    max_tokens: 150,
    system,
    messages: [{ role: 'user', content: user }],
  });

  try {
    const o = parseJson(extractText(msg));
    const amount = Number(o.amount);
    return {
      direction: o.direction === 'in' ? 'in' : 'out',
      amount,
      description: String(o.description || '').trim(),
      account: o.account && o.account !== 'null' ? String(o.account).toLowerCase() : null,
      confident: Boolean(o.confident) && amount > 0,
    };
  } catch {
    return { confident: false };
  }
}

/**
 * writeAdvice — turns the deterministic fortnightly numbers into 2-3 hyper-specific actions.
 * Claude receives ONLY computed figures; it reasons about them, it does not recompute them.
 */
export async function writeAdvice(computed, context = {}) {
  const system = [
    'You are a sharp Nigerian personal-finance analyst. You are given ALREADY-COMPUTED figures.',
    'Never recompute or invent numbers — use only what is given. Name exact merchants, exact amounts, exact targets.',
    'Output 2-3 concrete action steps as a JSON array of short strings. No prose, no fences.',
  ].join(' ');

  const user = `COMPUTED FIGURES:\n${JSON.stringify(computed, null, 2)}\n\nCONTEXT:\n${JSON.stringify(context)}\n\nReturn JSON: ["action 1", "action 2", "action 3"]`;

  const msg = await client().messages.create({
    model: MODEL_ANALYZE,
    max_tokens: 500,
    system,
    messages: [{ role: 'user', content: user }],
  });

  try { return parseJson(extractText(msg)); }
  catch { return ['(advice generation failed — figures above are still accurate)']; }
}
