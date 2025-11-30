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
import { validation, getValidationMessage } from "@/utils/validation";

export default function Login() {
  const router = useRouter();
  const { setIsAuthenticated, setUserRole } = useAuthStore();

  const [tenant, setTenant] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // ✅ Validate inputs
    if (!validation.required(tenant)) {
      Alert.alert("Validation", getValidationMessage("tenant", "required"));
      return;
    }

    if (!validation.slug(tenant.trim())) {
      Alert.alert("Validation", getValidationMessage("tenant", "invalid"));
      return;
    }

    if (!validation.required(username)) {
      Alert.alert("Validation", getValidationMessage("username", "required"));
      return;
    }

    if (!validation.username(username.trim())) {
      Alert.alert("Validation", getValidationMessage("username", "invalid"));
      return;
    }

    if (!validation.required(password)) {
      Alert.alert("Validation", getValidationMessage("password", "required"));
      return;
    }

    if (!validation.password(password)) {
      Alert.alert("Validation", getValidationMessage("password", "invalid"));
      return;
    }

    setLoading(true);

    try {
      const result = await login(username.trim(), password.trim(), tenant.trim());

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
      console.error("❌ Login error:", error);
      Alert.alert(
        "Login Failed",
        error.response?.data?.detail ||
          error.response?.data?.non_field_errors?.[0] ||
          error.message ||
          "Invalid credentials. Please try again."
      );
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
            placeholder="Crèche slug (e.g. arc-en-ciel)"
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
              <Text className="font-semibold">Note:</Text> Enter your kindergarten&apos;s slug,
              username, and password to sign in.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
