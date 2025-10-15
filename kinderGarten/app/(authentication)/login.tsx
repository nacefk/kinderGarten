import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import colors from "@/config/colors";

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("1234");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Missing Fields", "Please enter both username and password.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);

      if (username === "admin" && password === "1234") {
        router.replace("/(adminTabs)/dashboard");
      } else if (username === "parent" && password === "1234") {
        router.replace("/(tabs)/home");
      } else {
        Alert.alert("Login Failed", "Invalid username or password");
      }
    }, 1000);
  };

  return (
    <View className="flex-1 justify-center px-6" style={{ backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {/* Card */}
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
          {/* Title */}
          <Text className="text-2xl font-bold text-center mb-1" style={{ color: colors.textDark }}>
            Welcome 👋
          </Text>
          <Text className="text-base text-center mb-8" style={{ color: colors.text }}>
            Please sign in with your administrator or parent credentials.
          </Text>

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
              <Text className="font-semibold">Note:</Text> If you forgot your credentials, please
              contact the administrator.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
