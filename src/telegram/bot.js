// src/telegram/bot.js
import 'dotenv/config';
// The control surface. Long-polling bot (no public URL needed — perfect for local-first).
// Buttons trigger the cycles on demand; /log is the fast-entry path.
//
// Runs with JUST a Telegram token. If ANTHROPIC_API_KEY is also set, unknown merchants get
// classified by Claude; if not, the rules engine runs and flags unknowns as ERROR (no guessing).
//
// Start it:  TELEGRAM_BOT_TOKEN=... node src/telegram/bot.js   (or: npm run bot)

import TelegramBot from 'node-telegram-bot-api';
import { runCycleA } from '../cycles/cycleA.js';
import { runCycleB } from '../cycles/cycleB.js';
import { formatCycleASummary } from './format.js';
import { createSQLiteDataSource } from '../storage/sqliteDataSource.js';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) { console.error('Set TELEGRAM_BOT_TOKEN'); process.exit(1); }

const OWNER = process.env.TELEGRAM_CHAT_ID; // lock the bot to your own chat
const dataSource = createSQLiteDataSource();

// Wire Claude only if a key is present, so the bot also runs in rules-only mode.
let classifier = null, adviser = null, parseEntry = null;
if (process.env.ANTHROPIC_API_KEY) {
  const ai = await import('../ai/claude.js');
  classifier = ai.classifyMerchant; adviser = ai.writeAdvice; parseEntry = ai.parseEntry;
} else {
  console.warn('No ANTHROPIC_API_KEY — running rules-only; unknown merchants will be flagged ERROR.');
}

const ACCOUNT_KEYWORDS = { opay: 'ACC-02', access: 'ACC-01', zenith: 'ACC-03', fidelity: 'ACC-04', cash: 'CASH' };

const bot = new TelegramBot(token, { polling: true });

const menu = {
  reply_markup: {
    inline_keyboard: [
      [{ text: '▶️  Run Daily (Cycle A)', callback_data: 'cycleA' }],
      [{ text: '📊  Fortnightly Report (Cycle B)', callback_data: 'cycleB' }],
    ],
  },
};

const allowed = (chatId) => !OWNER || String(chatId) === String(OWNER);

bot.onText(/\/(start|menu)/, (m) => {
  if (!allowed(m.chat.id)) return;
  bot.sendMessage(m.chat.id,
    '💼 *Finance Agent*\n`/log <amount> <what> [account]` — expense\n`/receive <amount> <what> [account]` — income',
    { parse_mode: 'Markdown', ...menu });
});

// /log 4500 chowdeck opay  (expense/debit)
bot.onText(/^\/log\s+(\d+(?:\.\d+)?)\s+(.+?)(?:\s+(opay|access|zenith|fidelity))?$/i, async (m, match) => {
  if (!allowed(m.chat.id)) return;
  const [, amount, desc, acct] = match;
  const account_id = ACCOUNT_KEYWORDS[(acct || '').toLowerCase()] || 'ACC-02';
  await dataSource.appendTransaction({
    amount: Number(amount), raw_description: desc.trim(), account_id,
    type: 'DEBIT', transaction_type: 'EXPENSE',
    channel: 'App', time: new Date().toTimeString().slice(0, 8),
  });
  bot.sendMessage(m.chat.id, `📝 Logged ₦${amount} — _${desc.trim()}_. Hit *Run Daily* to process.`, { parse_mode: 'Markdown', ...menu });
});

// /receive 3500 project payment  (income/credit)
bot.onText(/^\/receive\s+(\d+(?:\.\d+)?)\s+(.+?)(?:\s+(opay|access|zenith|fidelity))?$/i, async (m, match) => {
  if (!allowed(m.chat.id)) return;
  const [, amount, desc, acct] = match;
  const account_id = ACCOUNT_KEYWORDS[(acct || '').toLowerCase()] || 'ACC-01';
  await dataSource.appendTransaction({
    amount: Number(amount), raw_description: desc.trim(), account_id,
    type: 'CREDIT', transaction_type: 'INCOME',
    channel: 'App', time: new Date().toTimeString().slice(0, 8),
  });
  bot.sendMessage(m.chat.id, `💚 Received ₦${amount} — _${desc.trim()}_. Hit *Run Daily* to process.`, { parse_mode: 'Markdown', ...menu });
});

bot.on('callback_query', async (q) => {
  const chatId = q.message.chat.id;
  if (!allowed(chatId)) return bot.answerCallbackQuery(q.id);
  await bot.answerCallbackQuery(q.id);

  try {
    if (q.data === 'cycleA') {
      await bot.sendMessage(chatId, '⏳ Running daily ingestion…');
      const r = await runCycleA({ dataSource, classifier });
      await bot.sendMessage(chatId, formatCycleASummary(r), { parse_mode: 'Markdown', ...menu });
    } else if (q.data === 'cycleB') {
      await bot.sendMessage(chatId, '⏳ Building fortnightly report…');
      const { text } = await runCycleB({ dataSource, adviser });
      await bot.sendMessage(chatId, text, { parse_mode: 'Markdown', ...menu });
    }
  } catch (err) {
    await bot.sendMessage(chatId, `⚠️ Run failed: ${err.message}`);
  }
});

// /save 10000 TGT-001  — manually move money to a savings target
bot.onText(/^\/save\s+(\d+(?:\.\d+)?)\s+(\S+)/i, async (m, match) => {
  if (!allowed(m.chat.id)) return;
  const [, amount, targetId] = match;
  await dataSource.appendTransaction({
    amount: Number(amount), raw_description: `PiggyVest deposit — ${targetId}`,
    account_id: 'ACC-05', type: 'DEBIT', transaction_type: 'EXPENSE',
    channel: 'App', time: new Date().toTimeString().slice(0, 8),
  });
  bot.sendMessage(m.chat.id, `🐷 Logged ₦${amount} → ${targetId}. Hit *Run Daily* to process.`, { parse_mode: 'Markdown', ...menu });
});

// Catch-all: free-text entry parsed by Claude (e.g. "energy drink 500" or "got 3.5k from project")
const esc = (s) => String(s || '').replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
bot.on('message', async (m) => {
  if (!allowed(m.chat.id)) return;
  const text = (m.text || '').trim();
  if (!text || text.startsWith('/')) return;
  if (!parseEntry) return;

  const e = await parseEntry(text);
  if (!e.confident) {
    return bot.sendMessage(m.chat.id,
      "Didn't catch that — try `energy drink 500` or `got 3500 from project`",
      { parse_mode: 'Markdown' });
  }
  const account_id = ACCOUNT_KEYWORDS[e.account] || 'CASH';
  const isIn = e.direction === 'in';
  await dataSource.appendTransaction({
    amount: e.amount, raw_description: e.description, account_id,
    type: isIn ? 'CREDIT' : 'DEBIT', transaction_type: isIn ? 'INCOME' : 'EXPENSE',
    channel: account_id === 'CASH' ? 'Cash' : 'App',
    time: new Date().toTimeString().slice(0, 8),
  });
  bot.sendMessage(m.chat.id,
    `${isIn ? '📥 In' : '📤 Out'}: ₦${e.amount} — _${esc(e.description)}_. Hit *Run Daily* to process.`,
    { parse_mode: 'Markdown', ...menu });
});

bot.on('polling_error', (e) => console.error('polling_error:', e.message));
console.log('Bot running. Send /start in Telegram.');
