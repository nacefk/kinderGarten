import { create } from "zustand";
import { Language } from "@/config/translations";
import * as SecureStore from "expo-secure-store";

interface LanguageStore {
  language: Language;
  setLanguage: (language: Language) => void;
  initLanguage: () => Promise<void>;
}

const LANGUAGE_KEY = "kindergarten_language";

export const useLanguageStore = create<LanguageStore>((set) => ({
  language: "fr",

  setLanguage: async (language: Language) => {
    try {
      await SecureStore.setItemAsync(LANGUAGE_KEY, language);
      set({ language });
    } catch (error) {
      set({ language });
    }
  },

  initLanguage: async () => {
    try {
      const savedLanguage = await SecureStore.getItemAsync(LANGUAGE_KEY);
      if (savedLanguage && (savedLanguage === "en" || savedLanguage === "fr" || savedLanguage === "ar")) {
        set({ language: savedLanguage as Language });
      }
    } catch (error) {
      // Silently fail - use default language
    }
  },
}));
