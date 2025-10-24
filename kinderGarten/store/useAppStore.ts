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
        const data = await getChildren(filters);
        set((state) => ({
          data: { ...state.data, childrenList: data },
        }));
      } catch (err) {
        console.error("❌ fetchChildren:", err);
      }
    },

    // 🏫 Fetch all classes
    fetchClasses: async () => {
      try {
        const data = await getClasses();
        set((state) => ({
          data: { ...state.data, classList: data },
        }));
      } catch (err) {
        console.error("❌ fetchClasses:", err);
      }
    },

    // 🎨 Fetch all clubs
    fetchClubs: async () => {
      try {
        const data = await getClubs();
        set((state) => ({
          data: { ...state.data, clubList: data },
        }));
      } catch (err) {
        console.error("❌ fetchClubs:", err);
      }
    },
  },
}));
