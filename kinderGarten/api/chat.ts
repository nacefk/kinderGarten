import { api } from "./api";
import { API_ENDPOINTS } from "@/config/api";

export async function getOrCreateConversation() {
  const res = await api.post(API_ENDPOINTS.CHAT_CONVERSATIONS, {});
  return res.data;
}

export async function getMessages(conversationId: number) {
  const res = await api.get(`${API_ENDPOINTS.CHAT_CONVERSATIONS}${conversationId}/`);
  return res.data.messages;
}

export async function sendMessage(conversationId: number, text: string) {
  const res = await api.post(API_ENDPOINTS.CHAT_MESSAGES, {
    conversation: conversationId,
    text,
  });
  return res.data;
}
