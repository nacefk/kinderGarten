import "@/global.css";
import React, { useEffect } from "react";
import { Slot } from "expo-router";
import { setupAxiosInterceptors } from "@/api/api";
import { useAuthStore } from "@/store/useAuthStore";
import { useLanguageStore } from "@/store/useLanguageStore";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function RootLayout() {
  const { checkAuth } = useAuthStore();
  const { initLanguage } = useLanguageStore();

  useEffect(() => {
    // ✅ Initialize auth on app startup
    checkAuth();

    // ✅ Initialize language preference from storage
    initLanguage();

    // ✅ Setup axios interceptors for token refresh
    setupAxiosInterceptors();
  }, []);

  return (
    <ErrorBoundary>
      <Slot />
    </ErrorBoundary>
  );
}
