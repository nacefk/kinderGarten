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

  // generic setter
  setData: (key: keyof AppState, value: any) => void;
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

  setData: (key, value) => set({ [key]: value }),
}));
