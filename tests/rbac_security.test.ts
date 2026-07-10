/**
 * RBAC Security Tests — Source-of-Truth Edition
 *
 * Reads the ACTUAL backend source files (Code.gs, AdminService.gs, Service_Package.gs)
 * to verify security invariants. If someone changes the backend without updating
 * these invariants, the tests will FAIL — that's the point.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const BACKEND_DIR = resolve(__dirname, '../backend');

// ─── Parse ROLE_PERMISSIONS from actual Code.gs ───
function parseRolePermissions(gsCode: string): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  // Match: Role: [\n    "action1",\n    "action2",\n  ],
  const roleBlockRegex = /(\w+):\s*\[([\s\S]*?)\]/g;
  let match;
  while ((match = roleBlockRegex.exec(gsCode)) !== null) {
    const roleName = match[1];
    // Skip non-role matches (e.g., PUBLIC_ACTIONS)
    if (!['Admin', 'Postal', "Staff", 'User'].includes(roleName)) continue;
    const actionsStr = match[2];
    const actions = actionsStr
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('"') && line.endsWith('",'))
      .map((line) => line.replace(/^"|",$/g, ''));
    result[roleName] = actions;
  }
  return result;
}

// ─── Parse PUBLIC_ACTIONS from actual Code.gs ───
function parsePublicActions(gsCode: string): string[] {
  const match = gsCode.match(/PUBLIC_ACTIONS\s*=\s*\[([\s\S]*?)\]/);
  if (!match) return [];
  return match[1]
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('"') && line.endsWith('",'))
    .map((line) => line.replace(/^"|",$/g, ''));
}

// ─── Parse getInitialData return keys from AdminService.gs ───
function parseGetInitialDataKeys(adminCode: string): string[] {
  // Find the getInitialData function body
  const fnMatch = adminCode.match(
    /getInitialData:\s*function\(\)\s*\{[\s\S]*?return\s*\{([\s\S]*?)\};/
  );
  if (!fnMatch) return [];
  const body = fnMatch[1];
  // Extract property names: "key:" or "key :"
  const keys: string[] = [];
  const keyRegex = /(\w+)\s*:/g;
  let m;
  while ((m = keyRegex.exec(body)) !== null) {
    keys.push(m[1]);
  }
  return keys;
}

// ─── Verify getSignatureImage accepts packageId (not fileId) ───
function verifySignatureImageParam(code: string): { ok: boolean; param: string } {
  const fnMatch = code.match(
    /function\s+getSignatureImage\s*\(\s*data\s*\)\s*\{[\s\S]*?var\s+(\w+)\s*=\s*data\.(\w+);/
  );
  if (!fnMatch) return { ok: false, param: 'NOT_FOUND' };
  const varName = fnMatch[1];
  const paramName = fnMatch[2];
  return { ok: paramName === 'packageId', param: paramName };
}

// ─── Verify confirmDelivery rejects external URLs ───
function verifyConfirmDeliveryRejectsUrls(pkgCode: string): boolean {
  // Find the confirmDelivery function's signature handling section
  const fnMatch = pkgCode.match(
    /savePackageEntry[\s\S]*?var\s+signatureImage[\s\S]*?var\s+signatureUrl\s*=\s*"";([\s\S]*?)(?:var\s+deptIdx|var\s+signatureFormula)/
  );
  if (!fnMatch) return false;
  const body = fnMatch[1];
  // Must NOT have: else if (/^https?:\/\//i.test(signatureImage))
  return !body.includes('https?://') && !body.includes('signatureImage) === 0 &&') === false;
}

// ═══════════════════════════════════════════════════════════
// Load actual backend source files
// ═══════════════════════════════════════════════════════════
let codeGs: string;
let adminServiceGs: string;
let servicePackageGs: string;
let ROLE_PERMISSIONS: Record<string, string[]>;
let PUBLIC_ACTIONS: string[];

beforeAll(() => {
  codeGs = readFileSync(resolve(BACKEND_DIR, 'Code.gs'), 'utf-8');
  adminServiceGs = readFileSync(resolve(BACKEND_DIR, 'AdminService.gs'), 'utf-8');
  servicePackageGs = readFileSync(resolve(BACKEND_DIR, 'Service_Package.gs'), 'utf-8');

  ROLE_PERMISSIONS = parseRolePermissions(codeGs);
  PUBLIC_ACTIONS = parsePublicActions(codeGs);

  // Sanity: we must have parsed all 4 roles
  expect(Object.keys(ROLE_PERMISSIONS)).toEqual(
    expect.arrayContaining(['Admin', 'Postal', 'Staff', 'User'])
  );
});

// ═══════════════════════════════════════════════════════════
// P0: getSystemConfigs — Admin-only (from ACTUAL source)
// ═══════════════════════════════════════════════════════════
describe('RBAC: getSystemConfigs — Admin-only (source-verified)', () => {
  it('Admin CAN access getSystemConfigs', () => {
    expect(ROLE_PERMISSIONS.Admin).toContain('getSystemConfigs');
  });

  it('Postal CANNOT access getSystemConfigs', () => {
    expect(ROLE_PERMISSIONS.Postal).not.toContain('getSystemConfigs');
  });

  it('Staff CANNOT access getSystemConfigs', () => {
    expect(ROLE_PERMISSIONS.Staff).not.toContain('getSystemConfigs');
  });

  it('User CANNOT access getSystemConfigs', () => {
    expect(ROLE_PERMISSIONS.User).not.toContain('getSystemConfigs');
  });

  it('getSystemConfigs is NOT in PUBLIC_ACTIONS', () => {
    expect(PUBLIC_ACTIONS).not.toContain('getSystemConfigs');
  });
});

// ═══════════════════════════════════════════════════════════
// P0: updateSystemConfig — Admin-only (from ACTUAL source)
// ═══════════════════════════════════════════════════════════
describe('RBAC: updateSystemConfig — Admin-only (source-verified)', () => {
  it('Admin CAN access updateSystemConfig', () => {
    expect(ROLE_PERMISSIONS.Admin).toContain('updateSystemConfig');
  });

  it('Postal CANNOT access updateSystemConfig', () => {
    expect(ROLE_PERMISSIONS.Postal).not.toContain('updateSystemConfig');
  });

  it('Staff CANNOT access updateSystemConfig', () => {
    expect(ROLE_PERMISSIONS.Staff).not.toContain('updateSystemConfig');
  });

  it('User CANNOT access updateSystemConfig', () => {
    expect(ROLE_PERMISSIONS.User).not.toContain('updateSystemConfig');
  });
});

// ═══════════════════════════════════════════════════════════
// P0: getInitialData — configs must NOT be bundled (from ACTUAL source)
// ═══════════════════════════════════════════════════════════
describe('RBAC: getInitialData — no configs leak (source-verified)', () => {
  it('getInitialData is accessible by all roles', () => {
    for (const role of ['Admin', 'Postal', 'Staff', 'User']) {
      expect(ROLE_PERMISSIONS[role]).toContain('getInitialData');
    }
  });

  it('AdminService.getInitialData() return object does NOT contain "configs"', () => {
    const keys = parseGetInitialDataKeys(adminServiceGs);
    expect(keys).toContain('departments');
    expect(keys).toContain('systemInfo');
    expect(keys).not.toContain('configs');
    expect(keys).not.toContain('systemConfigs');
    expect(keys).not.toContain('apiKeys');
    expect(keys).not.toContain('tokens');
  });
});

// ═══════════════════════════════════════════════════════════
// P0: Admin-only actions — must NOT leak (from ACTUAL source)
// ═══════════════════════════════════════════════════════════
describe('RBAC: Admin-only actions isolation (source-verified)', () => {
  const adminOnlyActions = [
    'getSystemConfigs', 'updateSystemConfig', 'setupUptimeMonitor',
    'adminGetUsers', 'adminAddUser', 'adminUpdateUser', 'adminDeleteUser',
    'createManualBackup', 'restoreFromBackup', 'runMaintenance',
    'getPublicTrackingLinks', 'validatePackageLogSchema',
    'repairPackageLogHeaders', 'repairProjectSheetHeaders',
    'normalizePackageLogStaffNames', 'normalizePackageLogLegacyValues',
    'migrateSignaturePrivacy',
  ];

  const nonAdminRoles = ['Postal', 'Staff', 'User'];

  for (const action of adminOnlyActions) {
    for (const role of nonAdminRoles) {
      it(`${role} CANNOT access ${action} (source-verified)`, () => {
        expect(ROLE_PERMISSIONS[role]).not.toContain(action);
      });
    }
  }
});

// ═══════════════════════════════════════════════════════════
// P0: getSignatureImage — all authenticated roles (from ACTUAL source)
// ═══════════════════════════════════════════════════════════
describe('RBAC: getSignatureImage — all authenticated roles (source-verified)', () => {
  it('Admin CAN access getSignatureImage', () => {
    expect(ROLE_PERMISSIONS.Admin).toContain('getSignatureImage');
  });

  it('Postal CAN access getSignatureImage', () => {
    expect(ROLE_PERMISSIONS.Postal).toContain('getSignatureImage');
  });

  it('Staff CAN access getSignatureImage', () => {
    expect(ROLE_PERMISSIONS.Staff).toContain('getSignatureImage');
  });

  it('User CAN access getSignatureImage', () => {
    expect(ROLE_PERMISSIONS.User).toContain('getSignatureImage');
  });
});

// ═══════════════════════════════════════════════════════════
// P0: getSignatureImage — must use packageId, NOT fileId (from ACTUAL source)
// ═══════════════════════════════════════════════════════════
describe('RBAC: getSignatureImage — packageId-only (source-verified)', () => {
  it('getSignatureImage() reads data.packageId (not data.fileId)', () => {
    const result = verifySignatureImageParam(codeGs);
    expect(result.ok).toBe(true);
    expect(result.param).toBe('packageId');
  });

  it('getSignatureImage() does NOT accept data.fileId', () => {
    // Check the function body doesn't reference data.fileId
    const fnMatch = codeGs.match(
      /function\s+getSignatureImage\s*\(\s*data\s*\)\s*\{([\s\S]*?)\n\}/
    );
    expect(fnMatch).toBeTruthy();
    if (fnMatch) {
      expect(fnMatch[1]).not.toContain('data.fileId');
    }
  });
});

// ═══════════════════════════════════════════════════════════
// P0: confirmDelivery — must reject external URLs (from ACTUAL source)
// ═══════════════════════════════════════════════════════════
describe('RBAC: confirmDelivery — reject external URLs (source-verified)', () => {
  it('confirmDelivery does NOT accept https URLs for signature', () => {
    // Find the signature handling in Service_Package.gs
    const sigSection = servicePackageGs.match(
      /var\s+signatureImage[\s\S]*?var\s+signatureFormula/
    );
    expect(sigSection).toBeTruthy();
    if (sigSection) {
      // Must NOT have: else if (/^https?:\/\//i.test(signatureImage))
      expect(sigSection[0]).not.toContain('https?://');
    }
  });
});

// ═══════════════════════════════════════════════════════════
// P0: No ANYONE_WITH_LINK in Service_Utils (from ACTUAL source)
// ═══════════════════════════════════════════════════════════
describe('RBAC: No public Drive sharing (source-verified)', () => {
  it('saveBase64ToDrive does NOT set ANYONE_WITH_LINK + Permission.VIEW', () => {
    const utilsCode = readFileSync(resolve(BACKEND_DIR, 'Service_Utils.gs'), 'utf-8');
    // Extract saveBase64ToDrive function body
    const fnMatch = utilsCode.match(
      /saveBase64ToDrive:\s*function[\s\S]*?^  \},/m
    );
    expect(fnMatch).toBeTruthy();
    if (fnMatch) {
      // Must NOT have: file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW)
      expect(fnMatch[0]).not.toContain('Permission.VIEW');
      // The string ANYONE_WITH_LINK may appear in migrateSignaturePrivacy (revoke access)
      // but NOT in saveBase64ToDrive
      expect(fnMatch[0]).not.toContain('ANYONE_WITH_LINK');
    }
  });
});

// ═══════════════════════════════════════════════════════════
// Integrity: Role hierarchy (from ACTUAL source)
// ═══════════════════════════════════════════════════════════
describe('RBAC: Permission structure integrity (source-verified)', () => {
  it('all 4 roles are parsed from source', () => {
    expect(Object.keys(ROLE_PERMISSIONS)).toEqual(
      expect.arrayContaining(['Admin', 'Postal', 'Staff', 'User'])
    );
  });

  it('Admin has more permissions than Postal', () => {
    expect(ROLE_PERMISSIONS.Admin.length).toBeGreaterThan(ROLE_PERMISSIONS.Postal.length);
  });

  it('Staff has more permissions than User', () => {
    expect(ROLE_PERMISSIONS.Staff.length).toBeGreaterThan(ROLE_PERMISSIONS.User.length);
  });

  it('no duplicate actions within any role', () => {
    for (const [role, actions] of Object.entries(ROLE_PERMISSIONS)) {
      const dupes = actions.filter((a, i) => actions.indexOf(a) !== i);
      expect(dupes).toEqual([]);
    }
  });

  it('PUBLIC_ACTIONS does not overlap with any role (except systemHealthCheck)', () => {
    // systemHealthCheck is in both PUBLIC_ACTIONS and Admin — that's by design
    for (const role of Object.keys(ROLE_PERMISSIONS)) {
      const overlap = PUBLIC_ACTIONS.filter(
        (a) => ROLE_PERMISSIONS[role].includes(a) && a !== 'systemHealthCheck'
      );
      expect(overlap).toEqual([]);
    }
  });
});

// ═══════════════════════════════════════════════════════════
// P0: Role cache must be cleared after deleteUser/updateUser
// ═══════════════════════════════════════════════════════════
describe('RBAC: Role cache clearing (source-verified)', () => {
  it('adminDeleteUser clears cache BEFORE and AFTER operation', () => {
    const code = readFileSync(resolve(BACKEND_DIR, 'Code.gs'), 'utf-8');
    // Extract adminDeleteUser handler
    const fnMatch = code.match(
      /adminDeleteUser:\s*\(data\)\s*=>\s*\{([\s\S]*?)\n  \},/
    );
    expect(fnMatch).toBeTruthy();
    if (fnMatch) {
      const body = fnMatch[1];
      // Must call _clearUserRoleCache at least twice (before + after)
      const cacheCalls = body.match(/_clearUserRoleCache/g);
      expect(cacheCalls).toBeTruthy();
      expect(cacheCalls!.length).toBeGreaterThanOrEqual(2);
      // Must check result.success before second clear
      expect(body).toContain('result.success');
    }
  });

  it('adminUpdateUser clears cache BEFORE and AFTER operation', () => {
    const code = readFileSync(resolve(BACKEND_DIR, 'Code.gs'), 'utf-8');
    const fnMatch = code.match(
      /adminUpdateUser:\s*\(data\)\s*=>\s*\{([\s\S]*?)\n  \},/
    );
    expect(fnMatch).toBeTruthy();
    if (fnMatch) {
      const body = fnMatch[1];
      const cacheCalls = body.match(/_clearUserRoleCache/g);
      expect(cacheCalls).toBeTruthy();
      expect(cacheCalls!.length).toBeGreaterThanOrEqual(2);
      expect(body).toContain('result.success');
    }
  });

  it('_clearUserRoleCache uses same key format as _verifyAccessV2', () => {
    const code = readFileSync(resolve(BACKEND_DIR, 'Code.gs'), 'utf-8');
    // Extract key format from _clearUserRoleCache
    const clearMatch = code.match(
      /function _clearUserRoleCache[\s\S]*?cacheKey\s*=\s*["']([^"']+)["']/
    );
    // Extract key format from _verifyAccessV2
    const verifyMatch = code.match(
      /function _verifyAccessV2[\s\S]*?cacheKey\s*=\s*["']([^"']+)["']/
    );
    expect(clearMatch).toBeTruthy();
    expect(verifyMatch).toBeTruthy();
    if (clearMatch && verifyMatch) {
      // Both must use the same prefix pattern
      expect(clearMatch[1]).toContain('user_role_');
      expect(verifyMatch[1]).toContain('user_role_');
    }
  });
});
