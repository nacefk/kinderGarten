import { getChildren } from "@/api/children";
import { getClasses } from "@/api/class";
import { create } from "zustand";

export const useAppStore = create((set, get) => ({
  data: {
    childrenList: [],
    classList: [],
  },
  loading: false,
  error: null,
  actions: {
    setData: (key, value) => {
      set((state) => ({
        data: { ...state.data, [key]: value },
      }));
    },

    fetchChildren: async () => {
      try {
        const data = await getChildren();
        set((state) => ({
          data: { ...state.data, childrenList: data },
        }));
      } catch (err) {
        console.error("❌ fetchChildren:", err);
      }
    },

    fetchChildrenByClass: async (classroomId) => {
      try {
        const data = await getChildren(classroomId);
        set((state) => ({
          data: { ...state.data, childrenList: data },
        }));
      } catch (err) {
        console.error("❌ fetchChildrenByClass:", err);
      }
    },

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
  },
}));
