import "@/global.css";
import React, { useEffect } from "react";
import { Slot } from "expo-router";
import { setupAxiosInterceptors } from "@/api/api";
import { useAuthStore } from "@/store/useAuthStore";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function RootLayout() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    // ✅ Initialize auth on app startup
    checkAuth();

    // ✅ Setup axios interceptors for token refresh
    setupAxiosInterceptors();
  }, []);

  return (
    <ErrorBoundary>
      <Slot />
    </ErrorBoundary>
  );
}
