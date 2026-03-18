
import { create } from "zustand";
import { persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getChildren, getClubs } from "@/api/children";
import { getClasses } from "@/api/class";

type TenantData = {
  id: number;
  name: string;
  slug: string;
  created_at: string;
  is_active: boolean;
  logo: string | null;
  primary_color: string | null;
  secondary_color: string | null;
};

type AppStoreState = {
  data: {
    childrenList: any[];
    classList: any[];
    clubList: any[];
    galleryItems: any[];
  };
  tenant: TenantData | null;
  loading: boolean;
  error: any;
  adminId: string | null;
  userId: string | null;
  actions: {
    setData: (key: string, value: any) => void;
    setAdminId: (adminId: string | null) => void;
    setUserId: (userId: string | null) => void;
    setTenant: (tenant: TenantData | null) => void;
    fetchChildren: (filters?: any) => Promise<void>;
    fetchClasses: () => Promise<void>;
    fetchClubs: () => Promise<void>;
    fetchTenant: () => Promise<void>;
    removeClassFromStore: (classId: number) => void;
    removeClubFromStore: (clubId: number) => void;
  };
};

export const useAppStore = create<AppStoreState>()(
  persist(
    (set, get) => ({
  data: {
    childrenList: [],
    classList: [],
    clubList: [],
    galleryItems: [],
  },
  tenant: null,
  loading: false,
  error: null,
  adminId: null,
  userId: null,

  actions: {
    setData: (key, value) => {
      set((state) => ({
        data: { ...state.data, [key]: value },
      }));
    },

    setAdminId: (adminId) => {
      set(() => ({ adminId }));
    },

    setUserId: (userId) => {
      set(() => ({ userId }));
    },
setTenant: (tenant) => {
      set(() => ({ tenant }));
    },

    // 🏢 Fetch tenant data (logo, primary_color, etc)
    fetchTenant: async () => {
      try {
        console.log("🏢 [Store] fetchTenant called");
        const { getTenant } = await import("@/api/tenant");
        const tenantData = await getTenant();
        if (tenantData) {
          set(() => ({ tenant: tenantData }));
          console.log("✅ [Store] Tenant data loaded - Primary (buttons/icons):", tenantData.primary_color, "| Secondary (header):", tenantData.secondary_color);
        } else {
          console.log("⚠️ [Store] getTenant returned null");
        }
      } catch (err) {
        console.error("❌ [Store] fetchTenant error:", err);
      }
    },


    // 🧒 Generic children fetcher — can filter by class or club
    fetchChildren: async (filters = {}) => {
      try {
        // filters can be { classroom: id } or { club: id }
        const data = await getChildren(filters);
        // ✅ getChildren already returns the array, no need to extract again
        set((state) => ({
          data: { ...state.data, childrenList: Array.isArray(data) ? data : [] },
        }));
      } catch (err) {
        console.error("❌ fetchChildren:", err);
      }
    },

    // 🏫 Fetch all classes
    fetchClasses: async () => {

      try {

        const data = await getClasses();

        set((state) => {
          const newState = {
            data: { ...state.data, classList: Array.isArray(data) ? data : [] },
          };
          return newState;
        });

      } catch (err) {
        console.error("❌ [STORE] fetchClasses error:", err);
      }
    },

    // 🎨 Fetch all clubs
    fetchClubs: async () => {
      try {
        const data = await getClubs();
        set((state: any) => ({
          data: { ...state.data, clubList: Array.isArray(data) ? data : [] },
        }));
      } catch (err) {
        console.error("❌ fetchClubs:", err);
      }
    },

    // 🗑️ Remove class from store immediately after deletion
    removeClassFromStore: (classId: number) => {
      set((state) => ({
        data: {
          ...state.data,
          classList: state.data.classList.filter((cls: any) => cls.id !== classId),
        },
      }));
    },

    // 🗑️ Remove club from store immediately after deletion
    removeClubFromStore: (clubId: number) => {
      set((state) => ({
        data: {
          ...state.data,
          clubList: state.data.clubList.filter((club: any) => club.id !== clubId),
        },
      }));
    },
  },
    }),
    {
      name: "app-store",
      storage: {
        getItem: async (name) => {
          try {
            const value = await AsyncStorage.getItem(name);
            return value ? JSON.parse(value) : null;
          } catch (error) {
            console.error("❌ AsyncStorage getItem error:", error);
            return null;
          }
        },
        setItem: async (name, value) => {
          try {
            const stringValue = JSON.stringify(value);
            await AsyncStorage.setItem(name, stringValue);
          } catch (error) {
            console.error("❌ AsyncStorage setItem error:", error);
          }
        },
        removeItem: async (name) => {
          try {
            await AsyncStorage.removeItem(name);
          } catch (error) {
            console.error("❌ AsyncStorage removeItem error:", error);
          }
        },
      },
      partialize: (state: any) => ({
        adminId: state.adminId,
        userId: state.userId,
        data: state.data,
        tenant: state.tenant,
      }) as any,
    }
  )
);
