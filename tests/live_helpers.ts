import { expect, type APIRequestContext } from '@playwright/test';
import { readFileSync } from 'fs';
import { resolve } from 'path';

export type GasResult<T = unknown> = {
  success?: boolean;
  data?: T;
  error?: string;
  count?: number;
  status?: string;
  checks?: Array<{ name: string; status: string; detail?: string }>;
  [key: string]: unknown;
};

const LIVE_BASE_URL = process.env.EPOSTAL_LIVE_BASE_URL || '';
const LIVE_AUTH_TOKEN = process.env.EPOSTAL_LIVE_AUTH_TOKEN || '';

const APP_VERSION = JSON.parse(readFileSync(resolve(__dirname, '../frontend/package.json'), 'utf-8')).version;

const isJsonBody = (text: string) => text.trim().startsWith('{') && !text.includes('<html');

export type GetGasResult = {
  ok: boolean;
  headers: Record<string, string>;
  body: string;
};

// GAS exec GETs suffer the same flakiness as POSTs (404 / HTML redirect page).
// Retry until the caller's validator accepts the response.
export async function getGas(
  request: APIRequestContext,
  query: string,
  validate: (body: string, headers: Record<string, string>) => boolean,
): Promise<GetGasResult> {
  let last: GetGasResult = { ok: false, headers: {}, body: '' };
  for (let attempt = 1; attempt <= 6; attempt++) {
    const response = await request.get(`${LIVE_BASE_URL}?${query}`, { timeout: 90_000 });
    const body = await response.text();
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(response.headers())) headers[key.toLowerCase()] = String(value);
    last = { ok: response.ok(), headers, body };
    if (response.ok() && validate(body, headers)) return last;
    if (attempt < 6) await new Promise((r) => setTimeout(r, 8_000));
  }
  return last;
}

async function postRaw(request: APIRequestContext, action: string, data: Record<string, unknown>): Promise<string> {
  let lastText = '';
  for (let attempt = 1; attempt <= 6; attempt++) {
    const response = await request.post(LIVE_BASE_URL, {
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      data: JSON.stringify({ action, ...data, clientVersion: APP_VERSION }),
      timeout: 90_000,
    });
    const text = await response.text();
    if (response.ok() && isJsonBody(text)) return text;
    lastText = text;
    if (attempt < 6) await new Promise((r) => setTimeout(r, 8_000));
  }
  throw new Error(`${action} failed after retries. HTTP-ish body: ${lastText.slice(0, 300)}`);
}

export async function wakeLive(request: APIRequestContext) {
  if (!LIVE_BASE_URL) return;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const response = await request.post(LIVE_BASE_URL, {
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      data: JSON.stringify({ action: 'systemHealthCheck', clientVersion: APP_VERSION }),
      timeout: 90_000,
    });
    const text = await response.text();
    if (response.ok() && isJsonBody(text)) return;
    if (attempt < 3) await new Promise((r) => setTimeout(r, 8_000));
  }
}

export async function postGas<T = unknown>(
  request: APIRequestContext,
  action: string,
  data: Record<string, unknown> = {},
): Promise<GasResult<T>> {
  const text = await postRaw(request, action, data);
  return JSON.parse(text) as GasResult<T>;
}

// savePackageEntry is idempotent by tracking number: if a prior attempt of the
// same run delivered an HTML/404 response while the write actually succeeded,
// the retry returns a JSON "already saved" error. Treat that as success so the
// write-smoke can safely retry.
export async function postSave<T = unknown>(
  request: APIRequestContext,
  data: Record<string, unknown>,
): Promise<GasResult<T>> {
  const result = await postGas<T>(request, 'savePackageEntry', data);
  if (result.success === false && /ถูกบันทึกเข้าระบบไปแล้ว|บันทึกซ้ำ/.test(String(result.error || ''))) {
    result.success = true;
    result.error = '(idempotent: already saved by an earlier attempt)';
  }
  return result;
}

export async function findLivePackage(request: APIRequestContext, trackingNo: string) {
  const search = await postGas<Array<Record<string, unknown>>>(request, 'searchPackages', {
    authToken: LIVE_AUTH_TOKEN,
    keyword: trackingNo,
    status: '',
  });
  expect(search.success, `searchPackages for ${trackingNo}`).toBe(true);
  return (search.data || []).find((row) =>
    String(row.trackingNo || row.trackingNumber || '').trim() === trackingNo
  );
}