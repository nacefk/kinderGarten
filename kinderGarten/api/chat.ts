import axios from "axios";

const BASE_URL = "http://192.168.0.37:8000/api/chat"; // ⚠️ adjust to your backend

// Fetch all conversations (depends on user role)
export const getConversations = async (token: string) => {
  const res = await axios.get(`${BASE_URL}/conversations/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Fetch one conversation (messages inside)
export const getConversationDetails = async (id: string, token: string) => {
  const res = await axios.get(`${BASE_URL}/conversations/${id}/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Send message
export const sendMessage = async (conversationId: string, text: string, token: string) => {
  const res = await axios.post(
    `${BASE_URL}/messages/`,
    {
      conversation: conversationId,
      text,
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
};
