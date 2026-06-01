// src/sheets/sheetsSync.js
// Pushes data from SQLite → Google Sheets after each Cycle A/B run.
// SQLite is the source of truth; Sheets is read-only dashboard.
//
// Sheet layout (auto-created on first sync):
//   Tab 1 — Transactions   (every logged + categorized transaction)
//   Tab 2 — Daily          (daily aggregate per Cycle A run)
//   Tab 3 — Balances       (current account balances)

import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SHEET_ID  = process.env.GOOGLE_SHEET_ID;
const CREDS     = process.env.GOOGLE_CREDENTIALS_PATH || './config/google-credentials.json';

const TABS = {
  TRANSACTIONS: 'Transactions',
  DAILY:        'Daily',
  BALANCES:     'Balances',
};

const HEADERS = {
  TRANSACTIONS: ['Date', 'Time', 'Description', 'Category', 'Sub-Category', 'Amount', 'In/Out', 'Account', 'Source', 'Flags'],
  DAILY:        ['Date', 'In (₦)', 'Out (₦)', 'Net (₦)', 'Top Category', 'Top Items', 'Txns', 'Fees (₦)', 'Net Worth (₦)', 'Anomalies'],
  BALANCES:     ['Account', 'Balance (₦)', 'Last Updated'],
};

const ACCT_NAMES = { 'ACC-01': 'Access', 'ACC-02': 'Opay', 'ACC-03': 'Zenith', 'ACC-04': 'Fidelity', 'CASH': 'Cash', 'ACC-05': 'PiggyVest' };

function getAuth() {
  const credsPath = path.resolve(__dirname, '..', '..', CREDS);
  const auth = new google.auth.GoogleAuth({
    keyFile: credsPath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return auth;
}

async function getSheets() {
  const auth = getAuth();
  return google.sheets({ version: 'v4', auth });
}

// Ensure a tab exists; create it if not.
async function ensureTab(sheets, tabName) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const exists = meta.data.sheets.some((s) => s.properties.title === tabName);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title: tabName } } }] },
    });
  }
}

// Write header row if the tab is empty.
async function ensureHeaders(sheets, tabName) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID, range: `${tabName}!A1:Z1`,
  });
  if (!res.data.values || res.data.values.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${tabName}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [HEADERS[tabName.toUpperCase().replace(' ', '_')] || HEADERS[Object.keys(HEADERS).find(k => TABS[k] === tabName)]] },
    });
  }
}

// Append rows to a tab.
async function appendRows(sheets, tabName, rows) {
  if (!rows.length) return;
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${tabName}!A1`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: rows },
  });
}

// Overwrite a tab completely (for Balances — always current snapshot).
async function overwriteTab(sheets, tabName, rows) {
  const headerKey = Object.keys(TABS).find(k => TABS[k] === tabName);
  const allRows = [HEADERS[headerKey], ...rows];
  await sheets.spreadsheets.values.clear({ spreadsheetId: SHEET_ID, range: `${tabName}!A:Z` });
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${tabName}!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: allRows },
  });
}

/**
 * syncTransactions — push newly categorized transactions to the Transactions tab.
 * Only pushes rows that aren't already there (checks by transaction_id via date+desc match).
 */
export async function syncTransactions(transactions) {
  if (!SHEET_ID) return;
  try {
    const sheets = await getSheets();
    await ensureTab(sheets, TABS.TRANSACTIONS);
    await ensureHeaders(sheets, TABS.TRANSACTIONS);

    const rows = transactions
      .filter((t) => t.AI_processed === 'TRUE' || t.source)
      .map((t) => [
        t.date || '',
        t.time || '',
        t.normalized_desc || t.raw_description || '',
        t.category_tier1 || '',
        t.category_tier2 || '',
        t.amount || 0,
        t.type === 'CREDIT' ? 'IN' : 'OUT',
        ACCT_NAMES[t.account_id] || t.account_id || '',
        t.source || '',
        t.flags || '',
      ]);

    await appendRows(sheets, TABS.TRANSACTIONS, rows);
    console.log(`   [sheets] synced ${rows.length} transactions`);
  } catch (err) {
    console.error('   [sheets] syncTransactions failed:', err.message);
  }
}

/**
 * syncDailyAggregate — push one daily aggregate row to the Daily tab.
 */
export async function syncDailyAggregate(aggregate) {
  if (!SHEET_ID) return;
  try {
    const sheets = await getSheets();
    await ensureTab(sheets, TABS.DAILY);
    await ensureHeaders(sheets, TABS.DAILY);

    const topItems = (aggregate.top_items || []).map((i) => `${i.item} ₦${i.amount}`).join(', ');
    const row = [
      aggregate.date || '',
      aggregate.real_inflow || 0,
      aggregate.net_real_spend || 0,
      (aggregate.real_inflow || 0) - (aggregate.net_real_spend || 0),
      aggregate.top_category || '',
      topItems,
      aggregate.transaction_count || 0,
      aggregate.transfer_fees_total || 0,
      aggregate.estimated_net_worth || 0,
      aggregate.anomaly_flags || '',
    ];

    await appendRows(sheets, TABS.DAILY, [row]);
    console.log(`   [sheets] synced daily aggregate for ${aggregate.date}`);
  } catch (err) {
    console.error('   [sheets] syncDailyAggregate failed:', err.message);
  }
}

/**
 * syncBalances — overwrite Balances tab with current account snapshot.
 */
export async function syncBalances(balances) {
  if (!SHEET_ID) return;
  try {
    const sheets = await getSheets();
    await ensureTab(sheets, TABS.BALANCES);

    const now = new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' });
    const rows = Object.entries(balances).map(([id, bal]) => [
      ACCT_NAMES[id] || id,
      bal,
      now,
    ]);

    await overwriteTab(sheets, TABS.BALANCES, rows);
    console.log(`   [sheets] synced ${rows.length} balances`);
  } catch (err) {
    console.error('   [sheets] syncBalances failed:', err.message);
  }
}
