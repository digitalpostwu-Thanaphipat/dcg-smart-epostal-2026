/**
 * ApiClient.ts
 * Frontend API client for GAS communication (Pro Max Edition)
 * Includes CORS fix (text/plain), Retry Logic, and Security Payload Injection.
 */

declare const google: any;

// Target GAS Web App URL
// Target GAS Web App URL [Hardened]
// When running inside GAS, google.script.run is used instead of HTTP fetch.
// VITE_GAS_URL is only needed for standalone deployment outside GAS.
const PROD_GAS_URL = import.meta.env?.VITE_GAS_URL || '';

// Only warn if not running inside GAS (google.script.run available)
const isInsideGAS = typeof google !== 'undefined' && google?.script?.run;
if (!PROD_GAS_URL && typeof window !== 'undefined' && window.location.hostname !== 'localhost' && !isInsideGAS) {
  console.warn("⚠️ VITE_GAS_URL not set. If deploying outside GAS, API calls will fail.");
}

const DEV_PROXY_URL = '/api';

const isLocal = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '[::1]');

const API_URL = isLocal ? DEV_PROXY_URL : PROD_GAS_URL;

function getStoredSessionToken() {
  try {
    const persistedAuth = localStorage.getItem('epostal-auth-storage');
    if (persistedAuth) {
      const parsed = JSON.parse(persistedAuth);
      const token = parsed?.state?.user?.sessionToken;
      if (token) return token;
    }

    const legacyUser = localStorage.getItem('epostal_user');
    if (legacyUser) {
      const parsed = JSON.parse(legacyUser);
      if (parsed?.sessionToken) return parsed.sessionToken;
    }
  } catch (e) {
    console.warn('[Auth] Failed to read stored session token', e);
  }
  return '';
}

async function fetchWithTimeout(url: string, options: RequestInit, timeout = 30000): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  const response = await fetch(url, { ...options, signal: controller.signal })
  clearTimeout(id)
  return response
}

export interface PostalPackage {
  id: string;
  packageId?: string; // Legacy/Compat
  trackingNo?: string;
  trackingNumber?: string;
  receiverName?: string; // Legacy/Compat
  recipientName?: string;
  building?: string;
  floor?: string;
  department: string;
  deptName?: string; // Compat
  status: string;
  date?: string;
  receivedAt?: string; // Compat
  deliveredAt?: string;
  type?: string;
  itemType?: string;
  signerName?: string;
  deliverer?: string;
  signature?: string;
  photo?: string;
  method?: string;
  useType?: string;
  note?: string;
  [key: string]: any;
}

export async function request(action: string, data: any = {}, method: 'GET' | 'POST' = 'POST') {
  const payload = { 
    ...data,
    clientVersion: '4.0.2' 
  };

  try {
    const sessionToken = getStoredSessionToken();
    if (sessionToken) {
      payload.authToken = payload.authToken || sessionToken;
    }
    // [SECURITY] mock-token bypass removed - all auth must go through OTP flow
  } catch(e) {
    // Silent fail - auth token will be missing, server will reject
  }

  const maxRetries = 3;
  const backoffBase = 1000;

  const isLockError = (errStr: string) => {
    const error = String(errStr).toLowerCase();
    return error.includes('system busy') || 
           error.includes('lock timeout') || 
           error.includes('scriptlock') || 
           error.includes('lockservice') ||
           error.includes('too many simultaneous');
  };

  if (typeof google !== 'undefined' && google.script && google.script.run) {
    const executeWithRetry = async (attempt = 0): Promise<any> => {
      return new Promise((resolve) => {
        google.script.run
          .withSuccessHandler(async (res: any) => {
            try {
              const parsed = typeof res === 'string' ? JSON.parse(res) : res;
              if (!parsed.success && isLockError(parsed.error) && attempt < maxRetries) {
                console.warn(`[Retry] Lock timeout on attempt ${attempt + 1}. Retrying...`);
                await new Promise(r => setTimeout(r, backoffBase * Math.pow(2, attempt)));
                return resolve(executeWithRetry(attempt + 1));
              }
              resolve(parsed);
            } catch (e) {
              resolve(res);
            }
          })
          .withFailureHandler(async (err: any) => {
            const errMsg = err.message || String(err);
            if (isLockError(errMsg) && attempt < maxRetries) {
              console.warn(`[Retry] GAS failure on attempt ${attempt + 1}: ${errMsg}. Retrying...`);
              await new Promise(r => setTimeout(r, backoffBase * Math.pow(2, attempt)));
              return resolve(executeWithRetry(attempt + 1));
            }
            resolve({ success: false, error: errMsg || 'Execution Error' });
          })
          .handleRequest(action, payload);
      });
    };
    return executeWithRetry();
  }

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (!API_URL) {
        return { success: false, error: 'API_URL_MISSING' };
      }

      const url = method === 'GET' ? `${API_URL}?action=${action}` : API_URL;
      const options: RequestInit = {
        method: method,
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: method === 'POST' ? JSON.stringify({ action, ...payload }) : undefined,
      };

      const response = await fetchWithTimeout(url, options);
      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);

      const text = await response.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch (e) {
         if (text.includes("ServiceLogin") || text.includes("google-signin")) {
             return { success: false, error: "AUTH_REQUIRED" };
         }
         return { success: false, error: "NON_JSON_RESPONSE" };
      }

      if (!json.success && json.error) {
         if (isLockError(json.error) && attempt < maxRetries) {
            console.warn(`[Retry] Proxy lock error on attempt ${attempt + 1}. Retrying...`);
            await new Promise(r => setTimeout(r, backoffBase * Math.pow(2, attempt)));
            continue;
         }
         return json;
      }

      return json;

    } catch (err: any) {
      if (err.name === 'AbortError') {
        if (attempt < maxRetries) {
           console.warn(`[Retry] Fetch timeout on attempt ${attempt + 1}. Retrying...`);
           await new Promise(r => setTimeout(r, backoffBase * Math.pow(2, attempt)));
           continue;
        }
        return { 
          success: false, 
          error: 'TIMEOUT_ERROR', 
          message: 'การเชื่อมต่อระบบใช้เวลานานเกินไป โปรดทำรายการใหม่อีกครั้ง' 
        };
      }
      
      if (attempt < maxRetries) {
        console.warn(`[Retry] Connection error on attempt ${attempt + 1}: ${err.message}. Retrying...`);
        await new Promise(r => setTimeout(r, backoffBase * Math.pow(2, attempt)));
        continue;
      }
      return { success: false, error: err.message || 'Connection Error' };
    }
  }
}

export const ApiClient = {
  auth: {
    login: (data: { email: string }) => request("requestLoginOtp", data, "POST"),
    requestOtp: (data: { email: string }) => request("requestLoginOtp", data, "POST"),
    verifyOtp: (data: { email: string; otp: string }) => request("verifyLoginOtp", data, "POST"),
    verifySession: () => request("verifySession", {}, "POST")
  },
  admin: {
    getDepartments: () => request("getDepts", null, "POST"),
    getPersonnel: () => request("getPersonnel", null, "POST"),
    getPositions: () => request("getPositions", null, "POST"),
    getRepresentatives: () => request("getRepresentatives", null, "POST"),
    getUsers: () => request("adminGetUsers", null, "POST"),
    addUser: (data: { email: string; fullName: string; role: string; department: string }) => request("adminAddUser", data, "POST"),
    updateUser: (data: { email: string; newRole: string; newDepartment: string }) => request("adminUpdateUser", data, "POST"),
    deleteUser: (email: string) => request("adminDeleteUser", { email }, "POST"),
    createManualBackup: () => request("createManualBackup", null, "POST"),
    restoreFromBackup: (data: { fileId: string }) => request("restoreFromBackup", data, "POST"),
    runMaintenance: () => request("runMaintenance", null, "POST"),
    getInitialData: () => request("getInitialData", null, "POST"),
    getSystemInfo: () => request("getSystemInfo", null, "POST"),
    getSystemConfigs: () => request("getSystemConfigs", null, "POST"),
    updateSystemConfig: (key: string, value: string) => request("updateSystemConfig", { key, value }, "POST"),
    setupUptimeMonitor: () => request("setupUptimeMonitor", null, "POST"),
    getPublicTrackingLinks: () => request("getPublicTrackingLinks", null, "POST")
  },
  postal: {
    saveEntry: (data: any) => request("savePackageEntry", data, "POST"),
    getPending: () => request("getPendingDeliveries", null, "POST"),
    confirm: (data: any) => request("confirmDelivery", data, "POST"),
    getStats: (filters?: { startDate?: string; endDate?: string; departmentName?: string }) => request("getDailyOperationalStats", filters || null, "POST"),
    searchPackages: (filters: {
      keyword?: string;
      status?: string;
      type?: string;
      department?: string;
      dateFrom?: string;
      dateTo?: string;
      fiscalYear?: string;
    }) => request("searchPackages", filters, "POST"),
    revert: (data: { packageId: string; reason: string }) => request("revertDelivery", data, "POST"),
    reportIssue: (packageId: string, reason: string) => request("reportDeliveryIssue", { packageId, reason }, "POST"),
    checkDuplicate: (trackingNumber: string) => request("checkDuplicate", { trackingNumber }, "POST"),
  },
  tracking: {
    getDepartments: () => request("getPublicTrackingDepartments", null, "POST"),
    publicSearch: (filters: {
      deptId?: string;
      token?: string;
      keyword?: string;
      status?: string;
      type?: string;
      dateFrom?: string;
      dateTo?: string;
      fiscalYear?: string;
    }) => request("publicSearchPackages", filters, "POST"),
  },
  feedback: {
    submit: (payload: any) => request("submitFeedback", payload, "POST"),
  },
  health: {
    check: () => request("systemHealthCheck", null, "POST"),
  },
  ai: {
    performOCR: (imageBase64: string) => request("performOCR", { image: imageBase64 }, "POST"),
    processImage: (imageBase64: string) => request("performOCR", { image: imageBase64 }, "POST"),
  },
  announcements: {
    get: () => request("getAnnouncements", null, "POST"),
  }
};
