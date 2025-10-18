import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, setAuthToken } from "./api";

export async function login(username: string, password: string) {
  const res = await api.post("auth/login/", { username, password });
  const { access, refresh } = res.data;
  await AsyncStorage.setItem("access_token", access);
  await AsyncStorage.setItem("refresh_token", refresh);
  setAuthToken(access);
  return res.data;
}

export async function logout() {
  await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
  setAuthToken(undefined);
}
