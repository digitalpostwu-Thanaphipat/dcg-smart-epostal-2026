import { create } from 'zustand'
import { ApiClient } from '@/api/client'
import { offlineDb } from '@/utils/offlineDb'

interface MasterDataState {
  departments: any[]
  buildings: any[]
  personnel: any[]
  positions: any[]
  representatives: any[]
  announcements: any[]
  stats: {
    todayReceived: number
    pendingDelivery: number
    deliveredToday: number
    personalCount: number
    regCount: number
    ordCount: number
    successDepts: number
    pendingDepts: number
    yoy?: Record<string, { total: number, completed: number }>
  }
  statsFilters: {
    startDate: string | null;
    endDate: string | null;
    departmentName: string | null;
  }
  systemInfo: {
    version: string;
    timestamp: string;
    linkedDbId: string;
    activeDbId: string;
  } | null
  isLoading: boolean
  error: string | null
  fetchMasterData: () => Promise<void>
  fetchStats: (filters?: any) => Promise<void>
}

export const useMasterDataStore = create<MasterDataState>((set) => ({
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
  statsFilters: {
    startDate: null,
    endDate: null,
    departmentName: null
  },
  isLoading: false,
  error: null,
  systemInfo: null,
  fetchMasterData: async () => {
    // 1. Try loading from Cache first
    try {
      const cached = await offlineDb.get('master-data-bundle');
      if (cached) {
        set({ ...cached, isLoading: false });
      }
    } catch (e) {
      console.warn("Offline load failed", e);
    }

    set({ isLoading: true, error: null })
    try {
      // Use Unified Fetch Strategy
      const res: any = await ApiClient.admin.getInitialData();
      
      if (res.success && res.data) {
        const { departments, personnel, positions, representatives, announcements, stats, systemInfo, configs } = res.data;
        
        const normalizedDepts = (departments || []).map((d: any) => ({
          id: d.DeptID || d.id,
          name: d.DeptName || d.name,
          building: d.Building || d.building,
          floor: d.Floor || d.floor
        }));

        const normalizedPersonnel = (personnel || []).map((p: any) => ({
          email: p.Email || p.email,
          fullName: p.FullName || p.fullName || p.name,
          department: p.Department || p.department
        }));

        const normalizedReps = (representatives || []).map((r: any) => ({
          id: r.id || r.id_,
          name: r.name || r.FullName || r.Name || "ตัวแทน",
          dept: r.department || r.DeptName || ""
        }));

        const freshData = {
          departments: normalizedDepts, 
          buildings: Array.from(new Set(normalizedDepts.map((d: any) => d.building))).map((b: any) => ({ id: b, name: b })),
          personnel: normalizedPersonnel,
          positions: positions || [],
          representatives: normalizedReps,
          announcements: announcements || [],
          systemInfo: systemInfo || null,
          stats: stats || { 
            todayReceived: 0, 
            pendingDelivery: 0, 
            deliveredToday: 0, 
            personalCount: 0,
            regCount: 0,
            ordCount: 0,
            successDepts: 0,
            pendingDepts: 0,
            yoy: {}
          }
        };

        set({ ...freshData, isLoading: false });

        // 2. Save to Cache
        await offlineDb.save('master-data-bundle', freshData);
      } else {
        set({ error: res.error || "Failed to fetch data", isLoading: false })
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false })
    }
  },
  fetchStats: async (filters: any) => {
    set({ isLoading: true, error: null, statsFilters: filters || { startDate: null, endDate: null, departmentName: null } })
    try {
      const statsRes: any = await ApiClient.postal.getStats(filters)
      console.log('🔍 Stats Debug:', statsRes); // T-016 Diagnosis
      if (statsRes.success) {
        set({ stats: statsRes.data, isLoading: false })
      } else {
        set({ error: "Failed to fetch stats", isLoading: false })
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false })
    }
  }
}))
