import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, setAuthToken } from "./api";
import { getChildren } from "./children";

export async function login(username: string, password: string) {
  const res = await api.post("auth/login/", { username, password });
  const { access, refresh, role } = res.data;
 console.log("🪪 Access token:", access);
  console.log("🔁 Refresh token:", refresh);
  // ✅ Store tokens
  await AsyncStorage.setItem("access_token", access);
  await AsyncStorage.setItem("refresh_token", refresh);

  // ✅ Apply token globally
  setAuthToken(access);

  // ✅ Fetch the parent’s child right after login
  let child = null;
  if (role === "parent") {
    try {
      const children = await getChildren(); // backend filters automatically
      child = children?.[0] || null;
      if (child) {
        await AsyncStorage.setItem("child_data", JSON.stringify(child));
        console.log("👶 Child profile loaded:", child.name);
      } else {
        console.warn("⚠️ No child linked to this account yet.");
      }
    } catch (e: any) {
      console.error("❌ Failed to fetch child data:", e.response?.data || e.message);
    }
  }

  return { ...res.data, child };
}

export async function logout() {
  await AsyncStorage.multiRemove(["access_token", "refresh_token", "child_data"]);
  setAuthToken(undefined);
}
