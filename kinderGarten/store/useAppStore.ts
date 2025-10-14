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
  data: {
    childrenList: any[];
    weeklyPlans: Record<string, any>;
    calendarEvents: any[];
    todayTimeline: any[];
    timelineByDay: Record<string, any[]>;
    galleryItems: any[];
    upcomingActivities: any[];
    attendanceToday: any[];
  };
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

  // ✅ initialize nested "data" with default empty arrays and objects
  data: {
    childrenList: [],
    weeklyPlans: {},
    calendarEvents: [],
    todayTimeline: [],
    timelineByDay: {},
    galleryItems: [],
    upcomingActivities: [],
    attendanceToday: [],
  },

  // ✅ safe, flexible setter
  setData: (key, value) =>
    set((state) => {
      if (key in state) {
        return { [key]: value };
      }
      return { data: { ...state.data, [key]: value } };
    }),
}));
