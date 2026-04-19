import "@/global.css";
import React, { useEffect } from "react";
import { Slot } from "expo-router";
import { setupAxiosInterceptors } from "@/api/api";
import { useAuthStore } from "@/store/useAuthStore";
import { useLanguageStore } from "@/store/useLanguageStore";
import { useAppStore } from "@/store/useAppStore";
import ErrorBoundary from "@/components/ErrorBoundary";
import * as Sentry from "@sentry/react-native";

Sentry.init({
  dsn: "https://d78d49023341f21a0cca4b40d237aa01@o4511242022158336.ingest.de.sentry.io/4511242034217040",

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

export default Sentry.wrap(function RootLayout() {
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
});
