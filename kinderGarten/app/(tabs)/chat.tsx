import { useEffect, useState, useCallback, useMemo } from "react";
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
import { useAuthStore } from "@/store/useAuthStore";

type Message = {
  id: string;
  text: string;
  sender: "user" | "other";
  time: string;
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  /** ✅ Load or create conversation on mount */
  useEffect(() => {
    (async () => {
      try {
        const convo = await getOrCreateConversation();
        setConversationId(convo.id);

        const msgs = convo.messages || (await getMessages(convo.id));
        const formatted = msgs.map((m: any) => ({
          id: m.id.toString(),
          text: m.text,
          sender: m.sender_name === "admin" ? "other" : "user",
          time: new Date(m.timestamp).toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }));
        setMessages(formatted);
      } catch (err: any) {
        console.error("❌ Error loading chat:", err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /** ✅ Send new message */
  const handleSend = useCallback(async () => {
    if (!input.trim() || !conversationId) return;

    const text = input.trim();
    const newMsg: Message = {
      id: Date.now().toString(),
      text,
      sender: "user",
      time: new Date().toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");

    try {
      await sendMessage(conversationId, text);
    } catch (err: any) {
      console.error("❌ Error sending message:", err.response?.data || err.message);
      // Optionally show error toast to user
    }
  }, [input, conversationId]);

  return (
    <View className="flex-1 bg-[#FAF8F5]">
      {/* Header */}
      <View
        className="flex-row items-center justify-between px-5 pt-16 pb-6"
        style={{ backgroundColor: colors.accentLight }}
      >
        <TouchableOpacity onPress={() => router.back()}>
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
