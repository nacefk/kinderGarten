import { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Send, ChevronLeft } from "lucide-react-native";
import { router } from "expo-router";
import colors from "@/config/colors";
import { getOrCreateConversation, getMessages, sendMessage } from "@/api/chat";
import { useLocalSearchParams } from "expo-router";
import { useAppStore } from "@/store/useAppStore";

type Message = {
  id: string;
  text: string;
  sender: "user" | "other";
  time: string;
};

export default function Chat() {
  // Polling interval in milliseconds
  const POLL_INTERVAL = 8000;
  const adminId = useAppStore((state) => state.adminId);
  const userId = useAppStore((state) => state.userId);
  console.log("[Chat] Parent screen loaded - adminId:", adminId, "parentId:", userId);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  /** ✅ Load or create conversation on mount, and poll for new messages only when screen is focused */
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      let poller: NodeJS.Timeout | null = null;

      const fetchMessages = async (cid: number) => {
        try {
          const msgs = await getMessages(cid);
          console.log("[Chat] Raw messages from API:", msgs);
          const formatted = msgs.map((m: any) => {
            console.log("[DEBUG] userId:", userId, "m.sender:", m.sender, "m:", m);
            const isCurrentUser = m.sender?.toString() === userId?.toString();
            return {
              id: m.id.toString(),
              text: m.text,
              sender: isCurrentUser ? "user" : "other",
              time: new Date(m.timestamp).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              }),
            };
          });
          if (isMounted) {
            setMessages(formatted);
          }
        } catch (err: any) {
          const errMsg = err.response?.data?.detail || err.response?.data?.error || err.message;
          console.error("❌ Chat error:", errMsg);
        }
      };

      (async () => {
        try {
          // Only try to create conversation if we have both IDs
          if (!adminId || !userId) {
            console.log("[Chat] Missing adminId or userId", { adminId, userId });
            setLoading(false);
            return;
          }

          console.log("[Chat] Creating conversation with admin:", adminId, "parent:", userId);
          const convo = await getOrCreateConversation(Number(adminId), Number(userId));
          console.log("[Chat] ✅ Conversation created/retrieved, ID:", convo.id);
          setConversationId(convo.id);

          const msgs = convo.messages || (await getMessages(convo.id));
          console.log("[Chat] Raw messages on load:", msgs);
          const formatted = msgs.map((m: any) => {
            console.log("[DEBUG] userId:", userId, "m.sender:", m.sender, "m:", m);
            const isCurrentUser = m.sender?.toString() === userId?.toString();
            return {
              id: m.id.toString(),
              text: m.text,
              sender: isCurrentUser ? "user" : "other",
              time: new Date(m.timestamp).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              }),
            };
          });
          if (isMounted) {
            setMessages(formatted);
          }
          setLoading(false);

          // Start polling for new messages only when screen is focused
          poller = setInterval(() => fetchMessages(convo.id), POLL_INTERVAL);
        } catch (err: any) {
          const errMsg = err.response?.data?.detail || err.response?.data?.error || err.message;
          console.error("❌ Chat error:", errMsg);
          setLoading(false);
        }
      })();

      return () => {
        isMounted = false;
        if (poller) clearInterval(poller);
      };
    }, [adminId, userId])
  );

  /** ✅ Send new message */
  const handleSend = useCallback(async () => {
    if (!input.trim() || !conversationId) {
      console.warn("[CHAT] Cannot send - missing input or conversationId");
      return;
    }

    const text = input.trim();
    setInput("");

    try {
      console.log("[CHAT] Sending message to conversation:", conversationId);
      await sendMessage(conversationId, text);
      // Fetch latest messages from server after sending
      const msgs = await getMessages(conversationId);
      console.log("[CHAT] Raw messages from API:", msgs);
      const formatted = msgs.map((m: any) => {
        console.log("[DEBUG] userId:", userId, "m.sender:", m.sender, "m:", m);
        const isCurrentUser = m.sender?.toString() === userId?.toString();
        return {
          id: m.id.toString(),
          text: m.text,
          sender: isCurrentUser ? "user" : "other",
          time: new Date(m.timestamp).toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
      });
      console.log("[CHAT] ✅ Updated messages count:", formatted.length);
      setMessages(formatted);
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || err.response?.data?.error || err.message;
      console.error("❌ Failed to send message:", errMsg);
    }
  }, [input, conversationId]);

  return (
    <View className="flex-1 bg-[#FAF8F5]">
      {/* Header */}
      <View
        className="flex-row items-center justify-between px-5 pt-16 pb-6"
        style={{ backgroundColor: colors.accentLight }}
      >
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.push("/(tabs)/home"))}
        >
          <ChevronLeft color="#374151" size={28} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-800">Discussion avec l’Admin</Text>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={colors.accent} />
            <Text className="mt-3 text-gray-600">Chargement des messages...</Text>
          </View>
        ) : (
          <>
            <FlatList
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View
                  className={`px-5 py-2 ${item.sender === "user" ? "items-end" : "items-start"}`}
                >
                  <View
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      item.sender === "user"
                        ? "bg-[#C6A57B] rounded-br-none"
                        : "bg-white rounded-bl-none"
                    }`}
                  >
                    <Text
                      className={`text-base ${item.sender === "user" ? "text-white" : "text-gray-800"}`}
                    >
                      {item.text}
                    </Text>
                    <Text
                      className={`text-xs mt-1 ${
                        item.sender === "user"
                          ? "text-gray-100 text-right"
                          : "text-gray-400 text-left"
                      }`}
                    >
                      {item.time}
                    </Text>
                  </View>
                </View>
              )}
              contentContainerStyle={{ paddingVertical: 10 }}
            />

            {/* Input area */}
            <View className="flex-row items-center bg-white px-4 py-3 border-t border-gray-200">
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Écrire un message..."
                className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-gray-800"
              />
              <TouchableOpacity onPress={handleSend} className="ml-3 bg-[#C6A57B] rounded-full p-2">
                <Send color="#fff" size={20} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}
