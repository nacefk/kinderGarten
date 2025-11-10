import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "http://192.168.0.37:8000/api/chat/";

export async function getOrCreateConversation() {
  const token = await AsyncStorage.getItem("access_token");
  const res = await axios.post(`${BASE_URL}conversations/`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function getMessages(conversationId: number) {
  const token = await AsyncStorage.getItem("access_token");
  const res = await axios.get(`${BASE_URL}conversations/${conversationId}/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.messages;
}

export async function sendMessage(conversationId: number, text: string) {
  const token = await AsyncStorage.getItem("access_token");
  const res = await axios.post(
    `${BASE_URL}messages/`,
    { conversation: conversationId, text },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}
