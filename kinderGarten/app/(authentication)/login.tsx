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
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import colors from "@/config/colors";
import { setAuthToken } from "@/api/api";

export default function Login() {
  const router = useRouter();

  // 👤 Local state
  const [tenant, setTenant] = useState("arc-en-ciel"); // ✅ will be needed for multi-tenant login
  const [username, setUsername] = useState("admin_arc");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const API_URL = "http://192.168.0.37:8000/api/accounts/login/";

  const handleLogin = async () => {
    if (!username || !password || !tenant) {
      Alert.alert("Missing Fields", "Please enter tenant, username, and password.");
      return;
    }

    setLoading(true);

    // 👀 Log the request
    console.log("📤 Sending login request to:", API_URL);
    console.log("➡️ Payload:", {
      tenant,
      username: username.trim(),
      password: "[HIDDEN]",
    });

    try {
      const res = await axios.post(API_URL, {
        tenant,
        username: username.trim(),
        password: password.trim(),
      });

      // ✅ Log response
      console.log("✅ Login response:");
      console.log("   Status:", res.status);
      console.log("   Headers:", res.headers);
      console.log("   Data:", res.data);

      const { access, refresh, role } = res.data;

      // ✅ Save tokens
      await AsyncStorage.setItem("access_token", access);
      await AsyncStorage.setItem("refresh_token", refresh);
      await AsyncStorage.setItem("tenant_slug", tenant);

      // ✅ Set auth token for axios
      setAuthToken(access);

      // ✅ Redirect based on role
      if (role === "admin") {
        router.replace("/(adminTabs)/dashboard");
      } else {
        router.replace("/(tabs)/home");
      }
    } catch (error: any) {
      console.error("❌ Login error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
      });

      Alert.alert(
        "Login Failed",
        error.response?.data?.detail ||
          error.response?.data?.non_field_errors?.[0] ||
          "Invalid username, password, or tenant."
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
          />

          {/* Username Input */}
          <TextInput
            className="w-full rounded-2xl px-5 py-4 text-base mb-4"
            placeholder="User ID"
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
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
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
              backgroundColor: colors.accent,
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
              <Text className="font-semibold">Note:</Text> Enter your kindergarten’s slug, username,
              and password to sign in.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
