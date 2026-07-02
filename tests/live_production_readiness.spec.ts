import { expect, test, type APIRequestContext } from '@playwright/test';

const LIVE_BASE_URL = process.env.EPOSTAL_LIVE_BASE_URL || '';
const LIVE_AUTH_TOKEN = process.env.EPOSTAL_LIVE_AUTH_TOKEN || '';
const LIVE_WRITE_ENABLED = process.env.EPOSTAL_LIVE_WRITE === '1';

type GasResult<T = unknown> = {
  success?: boolean;
  data?: T;
  error?: string;
  status?: string;
  checks?: Array<{ name: string; status: string; detail?: string }>;
  [key: string]: unknown;
};

async function postGas<T = unknown>(
  request: APIRequestContext,
  action: string,
  data: Record<string, unknown> = {},
) {
  const response = await request.post(LIVE_BASE_URL, {
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    data: JSON.stringify({ action, ...data, clientVersion: '4.0.2' }),
    timeout: 60_000,
  });

  expect(response.ok(), `${action} HTTP status`).toBeTruthy();
  const text = await response.text();
  expect(text, `${action} should return JSON, not HTML`).not.toContain('<html');
  return JSON.parse(text) as GasResult<T>;
}

test.describe('Live production readiness gate', () => {
  test.skip(!LIVE_BASE_URL, 'Set EPOSTAL_LIVE_BASE_URL to run live production readiness checks.');

  test('public tracking page and GAS PWA assets are served with expected content', async ({ page, request }) => {
    await page.goto(`${LIVE_BASE_URL}?publicTrack=1`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await expect(page.locator('body')).toContainText(/ePostal|DCG|ติดตาม|ไปรษณีย์/i);

    const manifestResponse = await request.get(`${LIVE_BASE_URL}?get=manifest`, { timeout: 60_000 });
    expect(manifestResponse.ok()).toBeTruthy();
    expect(manifestResponse.headers()['content-type']).toMatch(/json|text\/plain/i);
    const manifest = await manifestResponse.json();
    expect(manifest.name).toBe('DCG Smart ePostal');
    expect(manifest.display).toBe('standalone');

    const swResponse = await request.get(`${LIVE_BASE_URL}?get=sw`, { timeout: 60_000 });
    expect(swResponse.ok()).toBeTruthy();
    expect(swResponse.headers()['content-type']).toMatch(/javascript|text\/plain/i);
    const sw = await swResponse.text();
    expect(sw).toContain('CACHE_NAME');
    expect(sw).toContain('fetch');
  });

  test('systemHealthCheck exposes production operational checks', async ({ request }) => {
    const result = await postGas(request, 'systemHealthCheck');
    expect(result.success).toBe(true);
    const health = (result.data || result) as GasResult;
    expect(health.status).toMatch(/healthy|warn/);

    const checks = health.checks || [];
    for (const required of ['integrity', 'access', 'config', 'backup', 'trigger', 'monitor', 'sharding']) {
      expect(checks.map((check) => check.name), `missing health check: ${required}`).toContain(required);
    }

    const failingChecks = checks.filter((check) => check.status === 'fail');
    expect(failingChecks, `failing health checks: ${JSON.stringify(failingChecks)}`).toEqual([]);
  });

  test('security gate rejects protected actions without a valid session token', async ({ request }) => {
    const unauthenticated = await postGas(request, 'adminGetUsers');
    expect(unauthenticated.success).toBe(false);
    expect(String(unauthenticated.error)).toMatch(/login|session|token|ยืนยัน|เข้าสู่ระบบ/i);

    const invalidToken = await postGas(request, 'adminGetUsers', { authToken: 'invalid.token.value' });
    expect(invalidToken.success).toBe(false);
    expect(String(invalidToken.error)).toMatch(/Session token|token|ตรวจสอบ/i);
  });

  test('authenticated admin read smoke passes when a live token is provided', async ({ request }) => {
    test.skip(!LIVE_AUTH_TOKEN, 'Set EPOSTAL_LIVE_AUTH_TOKEN to run authenticated live checks.');

    const users = await postGas(request, 'adminGetUsers', { authToken: LIVE_AUTH_TOKEN });
    expect(users.success).toBe(true);
    expect(Array.isArray(users.data)).toBe(true);

    const search = await postGas(request, 'searchPackages', {
      authToken: LIVE_AUTH_TOKEN,
      keyword: '',
      status: '',
    });
    expect(search.success).toBe(true);
  });

  test('write lifecycle smoke is explicit opt-in for production data', async ({ request }) => {
    test.skip(!LIVE_AUTH_TOKEN, 'Set EPOSTAL_LIVE_AUTH_TOKEN to run write lifecycle smoke.');
    test.skip(!LIVE_WRITE_ENABLED, 'Set EPOSTAL_LIVE_WRITE=1 to write test records to production.');

    const trackingNo = `LIVE-READINESS-${Date.now()}`;
    const save = await postGas(request, 'savePackageEntry', {
      authToken: LIVE_AUTH_TOKEN,
      userEmail: 'digitalpost.wu@gmail.com',
      staffEmail: 'digitalpost.wu@gmail.com',
      departmentId: 'D001',
      departmentName: 'Production Readiness Test',
      emsList: [{
        trackingNo,
        receiverName: 'Production Readiness Test',
        recipientName: 'Production Readiness Test',
        itemType: 'EMS',
        isPersonal: false,
        notes: 'Automated live readiness record',
      }],
    });
    expect(save.success).toBe(true);

    const search = await postGas<Array<Record<string, unknown>>>(request, 'searchPackages', {
      authToken: LIVE_AUTH_TOKEN,
      keyword: trackingNo,
    });
    expect(search.success).toBe(true);
    expect(JSON.stringify(search.data || '')).toContain(trackingNo);

    const created = (search.data || []).find((row) =>
      String(row.trackingNo || row.trackingNumber || '').trim() === trackingNo
    );
    expect(created?.id, `created package id for ${trackingNo}`).toBeTruthy();

    const signatureSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="80"><rect width="100%" height="100%" fill="white"/><text x="16" y="48" font-family="Arial" font-size="20" fill="black">Live readiness</text></svg>';
    const signatureImage = `data:image/svg+xml;base64,${Buffer.from(signatureSvg).toString('base64')}`;
    const confirm = await postGas(request, 'confirmDelivery', {
      authToken: LIVE_AUTH_TOKEN,
      packageIds: [String(created?.id)],
      signatureImage,
      signatureName: 'Production Readiness Test',
      receiverName: 'Production Readiness Test',
      deliveryMethod: 'Production readiness smoke test',
      staffEmail: 'digitalpost.wu@gmail.com',
    });
    expect(confirm.success).toBe(true);
    expect(Number(confirm.count || 0)).toBeGreaterThan(0);

    const verifiedSearch = await postGas<Array<Record<string, unknown>>>(request, 'searchPackages', {
      authToken: LIVE_AUTH_TOKEN,
      keyword: trackingNo,
      status: '',
    });
    expect(verifiedSearch.success).toBe(true);
    const verified = (verifiedSearch.data || []).find((row) =>
      String(row.trackingNo || row.trackingNumber || '').trim() === trackingNo
    );
    expect(verified, `verified package for ${trackingNo}`).toBeTruthy();
    expect(String(verified?.status || '')).toMatch(/delivered|ส่ง|จ่าย|มอบ/i);
  });
});
