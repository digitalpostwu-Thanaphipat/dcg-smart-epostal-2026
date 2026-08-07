// Live test-data cleanup runner.
// Deletes the duplicated test records (EMS-20260501-0005, EMS-20260505-0001)
// via the [Admin-Only] backend action `adminDeletePackages`.
//
// Usage:
//   $env:EPOSTAL_LIVE_BASE_URL="https://..."  (required)
//   $env:EPOSTAL_LIVE_AUTH_TOKEN="..."        (required; admin session token)
//   $env:CONFIRM_CLEANUP="ล้างข้อมูลทดสอบ"      (required affirmation)
//   node scripts/run-live-testdata-cleanup.cjs
//
// Exit codes: 0 = cleanup verified, 1 = missing config, 2 = live call failed.

const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

const BASE_URL = process.env.EPOSTAL_LIVE_BASE_URL || '';
const AUTH_TOKEN = process.env.EPOSTAL_LIVE_AUTH_TOKEN || '';
const CONFIRM = process.env.CONFIRM_CLEANUP || '';
const TARGET_IDS = ['EMS-20260501-0005', 'EMS-20260505-0001'];

if (!BASE_URL || !AUTH_TOKEN) {
  console.error('Missing env: set EPOSTAL_LIVE_BASE_URL and EPOSTAL_LIVE_AUTH_TOKEN.');
  process.exit(1);
}
if (CONFIRM !== 'ล้างข้อมูลทดสอบ') {
  console.error('Refusing to run: set CONFIRM_CLEANUP="ล้างข้อมูลทดสอบ" to delete test records.');
  process.exit(1);
}

const APP_VERSION = JSON.parse(readFileSync(resolve(__dirname, '../frontend/package.json'), 'utf-8')).version;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// GAS exec endpoints are flaky (404 / HTML redirect page). Retry as in live_helpers.ts.
async function postGas(action, data) {
  let lastText = '';
  for (let attempt = 1; attempt <= 6; attempt++) {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action,
        authToken: AUTH_TOKEN,
        clientVersion: APP_VERSION,
        ...data,
      }),
    });
    const text = await res.text();
    if (res.ok && text.trim().startsWith('{') && !text.includes('<html')) return JSON.parse(text);
    lastText = text;
    if (attempt < 6) await sleep(8000);
  }
  throw new Error(`${action} failed after retries. Body: ${lastText.slice(0, 300)}`);
}

async function main() {
  console.log(`Targeting ${TARGET_IDS.join(', ')} on ${BASE_URL}`);

  // 1. Before: how many records currently match the two ids?
  const before = await postGas('searchPackages', {
    keyword: 'AS123456789TH',
    status: '',
    fiscalYear: 'all',
  });
  const beforeRows = Array.isArray(before.data) ? before.data : [];
  const beforeIds = beforeRows
    .map((r) => String(r.packageId || r.id || '').trim())
    .filter((id) => TARGET_IDS.includes(id));
  console.log(`Before cleanup: searchPackages matched ${beforeRows.length} row(s), target ids present: ${beforeIds.join(', ') || '(none)'}`);

  // Idempotent: nothing to delete => already verified clean.
  if (beforeRows.length === 0) {
    console.log('OK: no test records found — cleanup already done (or already verified).');
    process.exit(0);
  }

  // 2. Delete via [Admin-Only] action
  console.log('Calling adminDeletePackages ...');
  const deleted = await postGas('adminDeletePackages', {
    ids: TARGET_IDS,
    confirmation: 'ล้างข้อมูลทดสอบ',
    reason: 'ล้าง test data ซ้ำ (GO_LIVE_TASKS.md:73, DECISION_LOG.md:137)',
  });
  if (!deleted.success) {
    console.error('Delete failed:', JSON.stringify(deleted));
    process.exit(2);
  }
  console.log(`Deleted: ${(deleted.data?.deleted || []).map((r) => r.packageId).join(', ') || 'none'}`);
  if ((deleted.data?.missing || []).length) {
    console.warn('Missing (not found):', deleted.data.missing.join(', '));
  }

  // 3. After: verify duplicate is gone. Backend returns isDuplicate at top level.
  const after = await postGas('checkDuplicate', { trackingNumber: 'AS123456789TH' });
  const isDuplicate = after.isDuplicate ?? after.data?.isDuplicate;
  const dupStatus = after.success === true && isDuplicate === false;
  console.log(`checkDuplicate after cleanup: isDuplicate=${isDuplicate}`);

  if (!dupStatus) {
    console.error('Verification failed — duplicate still exists or unexpected response:', JSON.stringify(after));
    process.exit(2);
  }

  console.log('OK: test data cleanup verified.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Cleanup runner error:', err.message);
  process.exit(2);
});