import { expect, test } from '@playwright/test';
import { findLivePackage, postGas, postSave, wakeLive, liveToken } from './live_helpers';

const LIVE_AUTH_TOKEN = process.env.EPOSTAL_LIVE_AUTH_TOKEN || '';
const LIVE_WRITE_ENABLED = process.env.EPOSTAL_LIVE_WRITE === '1';

test.describe('Live full cycle: one parcel through every status', () => {
  test.skip(!LIVE_AUTH_TOKEN, 'Set EPOSTAL_LIVE_AUTH_TOKEN to run the full cycle test.');
  test.skip(!LIVE_WRITE_ENABLED, 'Set EPOSTAL_LIVE_WRITE=1 to write test records to production.');

  test('records one parcel and walks it through pending -> delivered -> reverted -> issue', async ({ request }) => {
    test.setTimeout(600_000);
    await wakeLive(request);
    const trackingNo = `LIVE-FULLCYCLE-${Date.now()}`;

    const save = await postSave(request, {
      authToken: LIVE_AUTH_TOKEN,
      userEmail: 'digitalpost.wu@gmail.com',
      staffEmail: 'digitalpost.wu@gmail.com',
      departmentId: 'D001',
      departmentName: 'Production Full Cycle Test',
      emsList: [{
        trackingNo,
        receiverName: 'Full Cycle Test',
        recipientName: 'Full Cycle Test',
        itemType: 'EMS',
        isPersonal: false,
        notes: 'Automated full lifecycle record',
      }],
    });
    expect(save.success, `savePackageEntry: ${save.error || ''}`).toBe(true);

    const dup = await postGas(request, 'checkDuplicate', {
      authToken: LIVE_AUTH_TOKEN,
      trackingNumber: trackingNo,
    });
    expect(dup.success, `checkDuplicate: ${dup.error || ''}`).toBe(true);
    expect(dup.isDuplicate, 'checkDuplicate should find the just-saved tracking number').toBe(true);

    const pending = await findLivePackage(request, trackingNo);
    expect(pending?.id, `package id for ${trackingNo}`).toBeTruthy();
    expect(String(pending?.status || '')).toMatch(/รอนำจ่าย|รอจ่าย|pending/i);
    const packageId = String(pending?.id);

    const pendingList = await postGas<Array<Record<string, unknown>>>(request, 'getPendingDeliveries', {
      authToken: LIVE_AUTH_TOKEN,
    });
    expect(pendingList.success).toBe(true);
    const inPending = (pendingList.data || []).some((row) =>
      String(row.id || row.packageId || '') === packageId
    );
    expect(inPending, 'parcel should appear in getPendingDeliveries').toBe(true);

    const signatureImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

    const confirm = await postGas(request, 'confirmDelivery', {
      authToken: LIVE_AUTH_TOKEN,
      packageIds: [packageId],
      signatureImage,
      signatureName: 'Full Cycle Test',
      receiverName: 'Full Cycle Test',
      deliveryMethod: 'Automated full lifecycle test',
      staffEmail: 'digitalpost.wu@gmail.com',
    });
    expect(confirm.success, `confirmDelivery: ${confirm.error || ''}`).toBe(true);
    expect(Number(confirm.count || 0)).toBeGreaterThan(0);

    const delivered = await findLivePackage(request, trackingNo);
    expect(delivered, 'parcel after confirm').toBeTruthy();
    expect(String(delivered?.status || '')).toMatch(/delivered|ส่ง|จ่าย|มอบ/i);

    const revert = await postGas(request, 'revertDelivery', {
      authToken: LIVE_AUTH_TOKEN,
      packageId,
      reason: 'Automated full lifecycle revert',
    });
    expect(revert.success, `revertDelivery: ${revert.error || ''}`).toBe(true);

    const reverted = await findLivePackage(request, trackingNo);
    expect(reverted, 'parcel after revert').toBeTruthy();
    expect(String(reverted?.status || '')).toMatch(/รอนำจ่าย|รอจ่าย|pending/i);
    expect(JSON.stringify(reverted)).toContain('ยกเลิก');

    const issue = await postGas(request, 'reportDeliveryIssue', {
      authToken: LIVE_AUTH_TOKEN,
      packageId,
      issueType: 'ตีกลับ',
      reason: 'Automated full lifecycle issue report',
    });
    expect(issue.success, `reportDeliveryIssue: ${issue.error || ''}`).toBe(true);

    const issued = await findLivePackage(request, trackingNo);
    expect(issued, 'parcel after issue report').toBeTruthy();
    expect(String(issued?.status || '')).toMatch(/มีปัญหา|ตีกลับ|issue/i);
    expect(JSON.stringify(issued)).toContain('ตีกลับ');
  });
});
