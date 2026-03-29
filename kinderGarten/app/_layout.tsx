import "@/global.css";
import React, { useEffect } from "react";
import { Slot } from "expo-router";
import { setupAxiosInterceptors } from "@/api/api";
import { useAuthStore } from "@/store/useAuthStore";
import { useLanguageStore } from "@/store/useLanguageStore";
import { useAppStore } from "@/store/useAppStore";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function RootLayout() {
  const { checkAuth, isAuthenticated } = useAuthStore();
  const { initLanguage } = useLanguageStore();
  const { actions } = useAppStore();

  useEffect(() => {
    // ✅ Setup axios interceptors first (idempotent)
    setupAxiosInterceptors();

    // ✅ Initialize auth on app startup
    checkAuth();

    // ✅ Initialize language preference from storage
    initLanguage();
  }, []);

  useEffect(() => {
    // ✅ Fetch tenant data only when authenticated
    if (isAuthenticated) {
      actions.fetchTenant();
    }
  }, [isAuthenticated]);

  return (
    <ErrorBoundary>
      <Slot />
    </ErrorBoundary>
  );
}
