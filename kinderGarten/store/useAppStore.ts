import { create } from "zustand";
import { getChildren, getClubs } from "@/api/children";
import { getClasses } from "@/api/class";

export const useAppStore = create((set, get) => ({
  data: {
    childrenList: [],
    classList: [],
    clubList: [],
  },
  loading: false,
  error: null,

  actions: {
    setData: (key, value) => {
      set((state) => ({
        data: { ...state.data, [key]: value },
      }));
    },

    // 🧒 Generic children fetcher — can filter by class or club
    fetchChildren: async (filters = {}) => {
      try {
        // filters can be { classroom: id } or { club: id }
        const response = await getChildren(filters);
        // ✅ Extract the 'results' array from paginated response
        const data = response?.results || response || [];
        set((state) => ({
          data: { ...state.data, childrenList: data },
        }));
      } catch (err) {
        console.error("❌ fetchChildren:", err);
      }
    },

    // 🏫 Fetch all classes
    fetchClasses: async () => {
      console.log("📦 [STORE] fetchClasses() called");
      try {
        console.log("📦 [STORE] Calling getClasses() API...");
        const response = await getClasses();
        console.log("📦 [STORE] getClasses() returned:", response);
        // ✅ Extract the 'results' array from paginated response
        const data = response?.results || response || [];
        console.log("📦 [STORE] Extracted data array with", Array.isArray(data) ? data.length : 0, "classes");
        set((state) => {
          const newState = {
            data: { ...state.data, classList: data },
          };
          console.log("📦 [STORE] New state classList:", newState.data.classList);
          return newState;
        });
        console.log("✅ [STORE] classList updated successfully");
      } catch (err) {
        console.error("❌ [STORE] fetchClasses error:", err);
      }
    },

    // 🎨 Fetch all clubs
    fetchClubs: async () => {
      try {
        const response = await getClubs();
        // ✅ Extract the 'results' array from paginated response
        const data = response?.results || response || [];
        set((state) => ({
          data: { ...state.data, clubList: data },
        }));
      } catch (err) {
        console.error("❌ fetchClubs:", err);
      }
    },

    // 🗑️ Remove class from store immediately after deletion
    removeClassFromStore: (classId: number) => {
      console.log("🗑️ [STORE] Removing class with ID:", classId);
      set((state) => ({
        data: {
          ...state.data,
          classList: state.data.classList.filter((cls: any) => cls.id !== classId),
        },
      }));
      console.log("✅ [STORE] Class removed from store");
    },

    // 🗑️ Remove club from store immediately after deletion
    removeClubFromStore: (clubId: number) => {
      console.log("🗑️ [STORE] Removing club with ID:", clubId);
      set((state) => ({
        data: {
          ...state.data,
          clubList: state.data.clubList.filter((club: any) => club.id !== clubId),
        },
      }));
      console.log("✅ [STORE] Club removed from store");
    },
  },
}));
