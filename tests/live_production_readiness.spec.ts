import { expect, test, type APIRequestContext } from '@playwright/test';
import { postGas, postSave, wakeLive, getGas, type GasResult } from './live_helpers';

const LIVE_BASE_URL = process.env.EPOSTAL_LIVE_BASE_URL || '';
const LIVE_AUTH_TOKEN = process.env.EPOSTAL_LIVE_AUTH_TOKEN || '';
const LIVE_WRITE_ENABLED = process.env.EPOSTAL_LIVE_WRITE === '1';

test.describe('Live production readiness gate', () => {
  test.skip(!LIVE_BASE_URL, 'Set EPOSTAL_LIVE_BASE_URL to run live production readiness checks.');

  test.beforeAll(async ({ request }) => {
    await wakeLive(request);
  });

  test('public tracking page and GAS PWA assets are served with expected content', async ({ request }) => {
    // GAS serves content inside an iframe, so check the raw HTML response instead of rendered body
    const tracking = await getGas(request, 'publicTrack=1', (body) => body.includes('ePostal'));
    expect(tracking.ok, 'publicTrack HTML response').toBeTruthy();

    const manifest = await getGas(request, 'get=manifest', (body, headers) => {
      if (!/json|text\/plain/i.test(headers['content-type'] || '')) return false;
      try {
        return JSON.parse(body).name === 'DCG Smart ePostal';
      } catch {
        return false;
      }
    });
    expect(manifest.ok, 'manifest response').toBeTruthy();
    expect(manifest.headers['content-type']).toMatch(/json|text\/plain/i);
    const manifestJson = JSON.parse(manifest.body);
    expect(manifestJson.name).toBe('DCG Smart ePostal');
    expect(manifestJson.display).toBe('standalone');

    const sw = await getGas(request, 'get=sw', (body) => body.includes('CACHE_NAME') && body.includes('fetch'));
    expect(sw.ok, 'service worker response').toBeTruthy();
    expect(sw.headers['content-type']).toMatch(/javascript|text\/plain/i);
    expect(sw.body).toContain('CACHE_NAME');
    expect(sw.body).toContain('fetch');
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
    const save = await postSave(request, {
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
    expect(save.success, `savePackageEntry: ${save.error || ''}`).toBe(true);

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

    const signatureImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
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
