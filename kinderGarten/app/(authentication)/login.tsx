import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import colors from "@/config/colors";
import { login } from "@/api/auth";
import { useAuthStore } from "@/store/useAuthStore";
import { validation, getValidationMessage, convertToSlug } from "@/utils/validation";

export default function Login() {
  const router = useRouter();
  const { setIsAuthenticated, setUserRole } = useAuthStore();

  const [tenant, setTenant] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // ℹ️ Validation temporarily disabled for testing

    // Convert tenant to slug format using helper
    const tenantSlug = convertToSlug(tenant);

    setLoading(true);

    try {
      const result = await login(username.trim(), password.trim(), tenantSlug);

      // ✅ Update auth state
      setIsAuthenticated(true);
      setUserRole(result.role);

      // ✅ Redirect based on role
      if (result.role === "admin") {
        router.replace("/(adminTabs)/dashboard");
      } else {
        router.replace("/(tabs)/home");
      }
    } catch (error: any) {
      console.error("❌ Login error:", {
        message: error.message,
        status: error.response?.status,
        details: error.response?.data,
      });

      // ✅ Provide detailed error messages
      let errorMessage = "Invalid credentials. Please try again.";

      if (error.response?.status === 401) {
        errorMessage = "Invalid username or password. Please check your credentials.";
      } else if (error.response?.status === 404) {
        errorMessage = "Kindergarten not found. Check the tenant slug: " + tenantSlug;
      } else if (error.response?.status === 400) {
        errorMessage =
          error.response?.data?.detail ||
          error.response?.data?.non_field_errors?.[0] ||
          "Invalid request. Please check all fields.";
      } else if (error.message?.includes("Network") || error.code === "ECONNREFUSED") {
        errorMessage =
          "Cannot connect to server. Check your internet connection and server address.";
      }

      Alert.alert("Login Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center px-6" style={{ backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View
          className="rounded-3xl p-8"
          style={{
            backgroundColor: colors.cardBackground,
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 10,
            elevation: 4,
          }}
        >
          {/* --- Title --- */}
          <Text className="text-2xl font-bold text-center mb-1" style={{ color: colors.textDark }}>
            Welcome 👋
          </Text>
          <Text className="text-base text-center mb-8" style={{ color: colors.text }}>
            Please sign in with your administrator or parent credentials.
          </Text>

          {/* Tenant Input */}
          <TextInput
            className="w-full rounded-2xl px-5 py-4 text-base mb-4"
            placeholder="Kindergarten slug (e.g. new-kindergarten)"
            placeholderTextColor={colors.textLight}
            style={{
              backgroundColor: "#F8F8F8",
              color: colors.textDark,
              borderWidth: 1,
              borderColor: "#E5E7EB",
            }}
            value={tenant}
            onChangeText={setTenant}
            autoCapitalize="none"
            editable={!loading}
          />

          {/* Username Input */}
          <TextInput
            className="w-full rounded-2xl px-5 py-4 text-base mb-4"
            placeholder="Username"
            placeholderTextColor={colors.textLight}
            style={{
              backgroundColor: "#F8F8F8",
              color: colors.textDark,
              borderWidth: 1,
              borderColor: "#E5E7EB",
            }}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            editable={!loading}
          />

          {/* Password Input */}
          <View
            className="mb-6 flex-row items-center rounded-2xl px-5"
            style={{
              backgroundColor: "#F8F8F8",
              borderWidth: 1,
              borderColor: "#E5E7EB",
            }}
          >
            <TextInput
              className="flex-1 text-base py-4"
              placeholder="Password"
              placeholderTextColor={colors.textLight}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              style={{ color: colors.textDark }}
              editable={!loading}
            />
            <TouchableOpacity disabled={loading} onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-outline" : "eye-off-outline"}
                size={22}
                color={colors.textLight}
              />
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.9}
            className="rounded-2xl py-4 items-center"
            style={{
              backgroundColor: loading ? "#ccc" : colors.accent,
              shadowColor: colors.accent,
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-lg font-semibold">Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Info Box */}
          <View
            className="mt-8 p-4 rounded-xl flex-row items-start"
            style={{
              backgroundColor: colors.accentLight,
              borderLeftWidth: 4,
              borderColor: colors.accent,
            }}
          >
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.accent}
              className="mr-2"
            />
            <Text style={{ color: colors.text }}>
              <Text className="font-semibold">Slug format:</Text> Use lowercase letters, numbers,
              and hyphens (e.g., new-kindergarten).{"\n\n"}
              <Text className="font-semibold">Example login:</Text> tenant-user / tenant123 /
              new-kindergarten
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
