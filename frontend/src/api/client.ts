/**
 * ApiClient.ts
 * Frontend API client for GAS communication (Pro Max Edition)
 * Includes CORS fix (text/plain), Retry Logic, and Security Payload Injection.
 */

declare const google: any;

// Target GAS Web App URL
// Target GAS Web App URL [Hardened]
const PROD_GAS_URL = import.meta.env?.VITE_GAS_URL;

if (!PROD_GAS_URL && typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
  console.error("❌ CRITICAL: VITE_GAS_URL is missing in Production! API calls will fail.");
}

const DEV_PROXY_URL = '/api';

const isLocal = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.port !== '');

const API_URL = isLocal ? DEV_PROXY_URL : PROD_GAS_URL;

async function fetchWithTimeout(url: string, options: RequestInit, timeout = 10000): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  const response = await fetch(url, { ...options, signal: controller.signal })
  clearTimeout(id)
  return response
}

export interface PostalPackage {
  id: string;
  trackingNo?: string;
  trackingNumber?: string;
  receiverName?: string;
  recipientName?: string;
  building?: string;
  department: string;
  status: string;
  date?: string;
  receivedAt?: string;
  type?: string;
  itemType?: string;
  signerName?: string;
  [key: string]: any;
}

export async function request(action: string, data: any = {}, method: 'GET' | 'POST' = 'POST') {
  const payload = { ...data };

  try {
    const userStr = localStorage.getItem('epostal_user');
    if (userStr && action !== 'login') {
      const user = JSON.parse(userStr);
      payload.userEmail = payload.userEmail || user.email;
      payload.staffEmail = payload.staffEmail || user.email;
      payload.role = payload.role || user.role;
      payload.deptId = payload.deptId || user.departmentId;
    }
  } catch(e) {}

  if (typeof google !== 'undefined' && google.script && google.script.run) {
    return new Promise((resolve) => {
      google.script.run
        .withSuccessHandler((res: any) => {
          try {
            resolve(typeof res === 'string' ? JSON.parse(res) : res);
          } catch (e) {
            resolve(res);
          }
        })
        .withFailureHandler((err: any) => resolve({ success: false, error: err.message || 'Execution Error' }))
        .handleRequest(action, payload);
    });
  }

  const maxRetries = 2;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
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
         if ((json.error.includes('System Busy')) && attempt < maxRetries) {
            await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
            continue;
         }
         return json;
      }

      return json;

    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { 
          success: false, 
          error: 'TIMEOUT_ERROR', 
          message: 'การเชื่อมต่อระบบใช้เวลานานเกินไป (มากกว่า 10 วินาที) โปรดทำรายการใหม่อีกครั้ง' 
        };
      }
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      return { success: false, error: err.message || 'Connection Error' };
    }
  }
}

export const ApiClient = {
  auth: {
    login: (data: { email: string }) => request("handleLogin", data, "POST")
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
    updateSystemConfig: (key: string, value: string) => request("updateSystemConfig", { key, value }, "POST")
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