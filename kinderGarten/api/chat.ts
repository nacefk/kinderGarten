// Fetch all conversations for the current user (admin)
export async function getConversations() {
  try {
    const res = await api.get(API_ENDPOINTS.CHAT_CONVERSATIONS);
    // Expecting an array of conversations
    return res.data;
  } catch (error: any) {
    const status = error.response?.status;
    const errorMsg = error.response?.data?.detail || error.response?.data?.error || "Unknown error";
    console.error(`[API] ❌ Failed to fetch conversations (${status}):`, errorMsg);
    return [];
  }
}
import { api } from "./api";
import { API_ENDPOINTS } from "@/config/api";

export async function getOrCreateConversation(adminId: number, parentId: number) {
  console.log("[API] Creating conversation with:", { admin: adminId, parent: parentId });
  
  try {
    const res = await api.post(API_ENDPOINTS.CHAT_CONVERSATIONS, {
      admin: adminId,
      parent: parentId,
    });
    
    console.log("[API] ✅ Conversation created:", { id: res.data.id });
    return res.data;
  } catch (error: any) {
    const status = error.response?.status;
    const errorMsg = error.response?.data?.detail || error.response?.data?.error || "Unknown error";
    console.error(`[API] ❌ Failed with status ${status}:`, errorMsg);
    throw error;
  }
}

export async function getMessages(conversationId: number) {
  console.log("[API] Fetching messages for conversation:", conversationId);
  const res = await api.get(`${API_ENDPOINTS.CHAT_CONVERSATIONS}${conversationId}/`);
  console.log("[API] Messages response:", res.data.messages);
  // Add senderId for clarity
  return res.data.messages.map((msg: any) => ({
    ...msg,
    senderId: msg.sender,
  }));
}

export async function sendMessage(conversationId: number, text: string) {
  console.log("[API] Sending message to conversation:", conversationId);
  
  try {
    const res = await api.post(API_ENDPOINTS.CHAT_MESSAGES, {
      conversation: conversationId,
      text,
    });
    console.log("[API] ✅ Message sent successfully");
    // Add senderId for clarity
    return {
      ...res.data,
      senderId: res.data.sender,
    };
  } catch (error: any) {
    const status = error.response?.status;
    const errorMsg = error.response?.data?.detail || error.response?.data?.error || "Unknown error";
    console.error(`[API] ❌ Failed to send message (${status}):`, errorMsg);
    throw error;
  }
}
