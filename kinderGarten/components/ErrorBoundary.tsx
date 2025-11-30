import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import colors from "@/config/colors";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Global error boundary to catch and handle crashes gracefully
 */
export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Update state so the next render will show the fallback UI
    this.setState({
      error,
      errorInfo,
    });

    // Log to console for development
    console.error("🚨 ERROR BOUNDARY CAUGHT:", error);
    console.error("❌ Error details:", errorInfo);

    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    // reportErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View
          className="flex-1 justify-center items-center px-5"
          style={{ backgroundColor: colors.background }}
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* Error Icon */}
            <Text className="text-6xl mb-4">⚠️</Text>

            {/* Error Title */}
            <Text className="text-2xl font-bold text-center mb-2" style={{ color: colors.error }}>
              Something Went Wrong
            </Text>

            {/* Error Message */}
            <Text className="text-center mb-4 text-base leading-6" style={{ color: colors.text }}>
              The app encountered an unexpected error. Please try again or contact support if the
              problem persists.
            </Text>

            {/* Error Details (Dev Only) */}
            {__DEV__ && this.state.error && (
              <View
                className="w-full p-4 rounded-xl mb-6 bg-red-50 border border-red-200"
                style={{ backgroundColor: "#FEE2E2", borderColor: "#FECACA" }}
              >
                <Text className="text-xs font-mono mb-2" style={{ color: colors.error }}>
                  {this.state.error.message}
                </Text>
                {this.state.errorInfo?.componentStack && (
                  <Text
                    className="text-xs font-mono text-gray-600"
                    numberOfLines={5}
                    style={{ color: colors.textLight }}
                  >
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </View>
            )}

            {/* Action Buttons */}
            <View className="flex-row gap-3 w-full max-w-xs">
              <TouchableOpacity
                onPress={this.handleReset}
                className="flex-1 py-3 rounded-xl items-center"
                style={{
                  backgroundColor: colors.accent,
                  shadowColor: colors.accent,
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  elevation: 3,
                }}
              >
                <Text className="text-white font-semibold">Try Again</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}
