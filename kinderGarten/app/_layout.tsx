import "@/global.css";
import React, { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Slot } from "expo-router";
import { setAuthToken } from "@/api/api";

export default function RootLayout() {
  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem("access_token");
      if (token) setAuthToken(token);
    })();
  }, []);
  return <Slot />;
}
