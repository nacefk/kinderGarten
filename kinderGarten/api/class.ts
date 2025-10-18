import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://192.168.0.37:8000/api/children/classes/";

export async function getClasses() {
  const token = await AsyncStorage.getItem("access_token");
  const res = await axios.get(API_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function createClass(name: string) {
  const token = await AsyncStorage.getItem("access_token");
  const res = await axios.post(
    API_URL,
    { name },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}
