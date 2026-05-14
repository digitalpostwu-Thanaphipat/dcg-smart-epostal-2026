import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMasterDataStore } from '../frontend/src/store/useMasterDataStore';
import { ApiClient } from '../frontend/src/api/client';
import { offlineDb } from '../frontend/src/utils/offlineDb';

// Mock ApiClient
vi.mock('../frontend/src/api/client', () => ({
  ApiClient: {
    admin: {
      getInitialData: vi.fn(),
    },
    postal: {
      getStats: vi.fn(),
    },
  },
}));

// Mock offlineDb (localStorage wrapper)
vi.mock('../frontend/src/utils/offlineDb', () => ({
  offlineDb: {
    get: vi.fn(),
    save: vi.fn(),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    clear: () => { store = {}; },
    removeItem: (key: string) => { delete store[key]; }
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('useMasterDataStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Reset zustand state manually
    useMasterDataStore.setState({
      departments: [],
      buildings: [],
      personnel: [],
      positions: [],
      representatives: [],
      announcements: [],
      stats: {
        todayReceived: 0,
        pendingDelivery: 0,
        deliveredToday: 0,
        personalCount: 0,
        regCount: 0,
        ordCount: 0,
        successDepts: 0,
        pendingDepts: 0,
        yoy: {}
      },
      isLoading: false,
      error: null
    });
  });

  it('should fetch and normalize master data correctly', async () => {
    const mockData = {
      success: true,
      data: {
        departments: [
          { DeptID: 'D01', DeptName: 'Engineering', Building: 'B1', Floor: '1' }
        ],
        personnel: [
          { Email: 'test@example.com', FullName: 'John Doe', DeptID: 'D01' }
        ],
        positions: [
          { id: 'P01', PositionName: 'Lead Engineer', DeptID: 'D01' }
        ],
        representatives: [
          { id: 'R01', RepName: 'Jane Smith', DeptID: 'D01' }
        ],
        announcements: [],
        stats: { todayReceived: 10 },
        systemInfo: { version: '1.0.0' }
      }
    };

    (ApiClient.admin.getInitialData as any).mockResolvedValue(mockData);
    (offlineDb.get as any).mockResolvedValue(null);

    await useMasterDataStore.getState().fetchMasterData();

    const state = useMasterDataStore.getState();

    // Check normalization
    expect(state.departments[0]).toEqual({
      id: 'D01',
      name: 'Engineering',
      building: 'B1',
      floor: '1'
    });

    expect(state.personnel[0]).toEqual({
      email: 'test@example.com',
      fullName: 'John Doe',
      deptId: 'D01',
      department: ''
    });

    expect(state.buildings).toContainEqual({ id: 'B1', name: 'B1' });
    expect(state.stats.todayReceived).toBe(10);
    expect(offlineDb.save).toHaveBeenCalled();
  });

  it('should load from cache if available', async () => {
    const cachedData = {
      departments: [{ id: 'C01', name: 'Cached Dept' }],
      buildings: [],
      personnel: [],
      positions: [],
      representatives: [],
      announcements: [],
      stats: { todayReceived: 5 },
      systemInfo: null
    };

    (offlineDb.get as any).mockResolvedValue(cachedData);
    (ApiClient.admin.getInitialData as any).mockResolvedValue({ success: false });

    await useMasterDataStore.getState().fetchMasterData();

    const state = useMasterDataStore.getState();
    expect(state.departments[0].name).toBe('Cached Dept');
    expect(state.stats.todayReceived).toBe(5);
  });

  it('should handle API errors gracefully', async () => {
    (ApiClient.admin.getInitialData as any).mockRejectedValue(new Error('Network Error'));
    (offlineDb.get as any).mockResolvedValue(null);

    await useMasterDataStore.getState().fetchMasterData();

    const state = useMasterDataStore.getState();
    expect(state.error).toBe('Network Error');
    expect(state.isLoading).toBe(false);
  });
});
