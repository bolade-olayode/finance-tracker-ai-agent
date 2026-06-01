# Finance Agent — local-first build

AI personal finance agent. **Deterministic engine does all math + routing; Claude is used
only for judgement** (classifying unknown merchants, writing the fortnightly advice). This
enforces the "zero hallucinated figures" rule — the LLM never touches arithmetic.

**Control model: local-first, Telegram-triggered.** No cron to babysit. You press a button
in your Telegram chat and the cycle runs on demand; because Cycle A is idempotent it sweeps
up everything still `PENDING`, so a missed/skipped run is never a problem. The same bot is
also your fast-entry path via `/log`.

## Run it locally right now (just a Telegram token)

```bash
npm install
cp .env.example .env          # fill in at least TELEGRAM_BOT_TOKEN
npm run bot                   # then send /start in your Telegram chat
```

Without an `ANTHROPIC_API_KEY` it runs rules-only (unknown merchants flagged ERROR, never
guessed). Add the key and Claude classifies unknowns + writes the advice. It currently uses
a **mock data source** (sample transactions) so you can press the buttons and watch the full
loop work before Google Sheets is connected.

No credentials at all? See the logic run against the mock:
```bash
npm run demo     # engine: categorization + math
npm test         # full control loop: both cycles + the rendered Telegram report
```

## Telegram controls
- **▶️ Run Daily (Cycle A)** — ingest + categorize all PENDING, write the daily aggregate
- **📊 Fortnightly Report (Cycle B)** — roll up 14 days, Claude writes 2-3 actions, sends report
- `/log 4500 chowdeck opay` — quick entry (amount, description, account)
- Set `TELEGRAM_CHAT_ID` to lock the bot to your own chat.

## Structure
```
config/      accounts · fees (2026 model) · categories · merchant-map (self-improving) · profile
src/engine/  categorize.js (rules-first + Claude fallback) · compute.js (ALL math, pure)
src/ai/      claude.js (Haiku classify / Sonnet analyze — never does arithmetic)
src/cycles/  cycleA.js (idempotent catch-up) · cycleB.js (fortnightly)
src/telegram/ bot.js (control surface) · format.js (report formatter)
src/sheets/  dataSource.js (adapter interface + local mock)   ← real Sheets adapter is next
test/        demo.js · cycle.test.js
```

## What's left
- [ ] Confirm `config/profile.js`: primary income account + the 3 PiggyVest targets.
- [ ] Build the real Sheets adapter (implements the dataSource interface) + service-account creds.
- [ ] Swap `createMockDataSource()` for `createSheetsDataSource()` in `src/telegram/bot.js` (one line).
- [ ] Later: move the bot to an always-on VPS; add a backup schedule + heartbeat.
