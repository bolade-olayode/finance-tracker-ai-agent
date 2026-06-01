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
