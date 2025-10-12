import { create } from "zustand";

interface AppState {
  profile: any;
  dailySummary: any;
  timeline: any[];
  upcomingEvents: any[];
  extraHours: any;
  todayTimeline: any[];
  timelineByDay: Record<string, any[]>;
  galleryItems: any[];
  upcomingActivities: any[];

  // new section for dynamic datasets (mock/admin data)
  data: Record<string, any>;

  // generic setter
  setData: (key: keyof AppState | string, value: any) => void;
}

export const useAppStore = create<AppState>((set) => ({
  profile: null,
  dailySummary: null,
  timeline: [],
  upcomingEvents: [],
  extraHours: null,
  todayTimeline: [],
  timelineByDay: {},
  galleryItems: [],
  upcomingActivities: [],

  // ✅ initialize data object so it never crashes
  data: {},

  // ✅ keep flexibility for both AppState keys and nested "data" keys
  setData: (key, value) =>
    set((state) => {
      if (key in state) {
        // direct property update (like old behavior)
        return { [key]: value };
      }
      // nested data update (used by loadMockData)
      return { data: { ...state.data, [key]: value } };
    }),
}));
