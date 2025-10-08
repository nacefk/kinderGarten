// app/(authentication)/login.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, StatusBar, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    // TODO: Replace with your backend validation later
    console.log("Username:", username);
    console.log("Password:", password);

    router.replace("/(tabs)/home");
  };

  return (
    <View className="flex-1 justify-center items-center bg-white px-8">
      <StatusBar barStyle={'dark-content'} />
      <Image
      source={require('../../assets/images/logo.png')}
      className="w-40 h-40 mb-2"
      resizeMode="contain"
      />

      <Text className="text-lg text-gray-600 mb-10 text-center">
      Please enter your credentials provided by the administrator.
      </Text>

      {/* Username Field */}
      <TextInput
      className="w-full border border-gray-300 rounded-xl p-4 mb-6 text-lg"
      placeholder="User ID"
      value={username}
      onChangeText={setUsername}
      autoCapitalize="none"
      />

      {/* Password Field with Eye Icon */}
      <View className="w-full border border-gray-300 rounded-xl flex-row items-center mb-8 px-4">
      <TextInput
        className="flex-1 text-lg py-4"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
      />
      <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
        <Ionicons
        name={showPassword ? "eye-outline" :"eye-off-outline" }
        size={28}
        color="#555"
        />
      </TouchableOpacity>
      </View>

      {/* Login Button */}
      <TouchableOpacity
      onPress={handleLogin}
      className="bg-blue-600 py-4 px-12 rounded-xl w-full"
      >
      <Text className="text-white text-xl font-semibold text-center">
        Login
      </Text>
      </TouchableOpacity>

      <View className="mt-8 bg-blue-50 border-l-4 border-blue-400 p-4 w-full rounded-xl">
      <Text className="text-blue-700 text-base">
        <Text className="font-bold">NB:</Text> In case you forget your
        credentials, contact the administrator.
      </Text>
      </View>
    </View>
  );
}
