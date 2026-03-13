
import { create } from "zustand";
import { persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getChildren, getClubs } from "@/api/children";
import { getClasses } from "@/api/class";

type AppStoreState = {
  data: {
    childrenList: any[];
    classList: any[];
    clubList: any[];
    galleryItems: any[];
  };
  loading: boolean;
  error: any;
  adminId: string | null;
  userId: string | null;
  actions: {
    setData: (key: string, value: any) => void;
    setAdminId: (adminId: string | null) => void;
    setUserId: (userId: string | null) => void;
    fetchChildren: (filters?: any) => Promise<void>;
    fetchClasses: () => Promise<void>;
    fetchClubs: () => Promise<void>;
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
      partialize: (state) => ({
        adminId: state.adminId,
        userId: state.userId,
        data: state.data,
      }),
    }
  )
);
