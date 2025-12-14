import { create } from "zustand";
import { getChildren, getClubs } from "@/api/children";
import { getClasses } from "@/api/class";

export const useAppStore = create((set, get) => ({
  data: {
    childrenList: [],
    classList: [],
    clubList: [],
    galleryItems: [],
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
}));
