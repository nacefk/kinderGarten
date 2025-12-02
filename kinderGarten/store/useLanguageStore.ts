import { create } from "zustand";
import { Language } from "@/config/translations";

interface LanguageStore {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const useLanguageStore = create<LanguageStore>((set) => ({
  language: "en",
  setLanguage: (language: Language) => set({ language }),
}));
