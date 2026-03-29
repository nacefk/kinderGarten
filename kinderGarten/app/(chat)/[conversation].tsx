import React, { useState, useCallback, useEffect } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ChevronLeft, Send } from "lucide-react-native";
import { getColors } from "@/config/colors";
import { useAppStore } from "@/store/useAppStore";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useLanguageStore } from "@/store/useLanguageStore";
import { getTranslation } from "@/config/translations";
import { sendMessage, getMessages, getOrCreateConversation } from "@/api/chat";

type Message = {
  id: string;
  text: string;
  sender: "user" | "other";
  time: string;
};

export default function ConversationScreen() {
  // Polling interval in milliseconds
  const POLL_INTERVAL = 8000;
  const userId = useAppStore((state) => state.userId);
  const tenant = useAppStore((state) => state.tenant);
  const colors = getColors(tenant?.primary_color, tenant?.secondary_color);
  const { id: paramId, conversation, name, avatar, adminId, parentId } = useLocalSearchParams();
  // // console.log("[Conversation] Params received:", {
  //   paramId,
  //   conversation,
  //   name,
  //   adminId,
  //   parentId,
  // });

  // Handle id possibly being string[]
  let id: string | number | null = null;
  let rawId: string | string[] | null = paramId || conversation || null;
  if (Array.isArray(rawId)) {
    id = rawId[0];
  } else {
    id = rawId;
  }
  if (typeof id === "string" && /^\d+$/.test(id)) {
    id = Number(id);
  }

  const [conversationId, setConversationId] = useState<string | number | null>(
    id !== "new" ? id : null
  );
  // console.log("[Conversation] Initial ID:", conversationId);

  const { language } = useLanguageStore();
  const t = (key: string) => getTranslation(language, key);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  // Create conversation if needed
  useEffect(() => {
    if (conversationId) return; // Already have an ID
    if (!adminId || !parentId) {
      console.warn("[Conversation] Missing adminId or parentId, cannot create conversation");
      return;
    }

    (async () => {
      try {
        // // console.log(
        //   "[Conversation] Creating conversation with admin:",
        //   adminId,
        //   "parent:",
        //   parentId
        // );
        const convo = await getOrCreateConversation(Number(adminId), Number(parentId));
        // // console.log("[Conversation] \u2705 Conversation created, ID:", convo.id);
        setConversationId(convo.id);
      } catch (err: any) {
        console.error("[Conversation] ❌ Failed to create conversation:", err.message);
      }
    })();
  }, []);

  // Fetch messages when conversation ID is available (initial fetch and polling only when screen is focused)
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      let poller: NodeJS.Timeout | null = null;

      const fetchMessages = async () => {
        if (!conversationId) return;
        try {
          const msgs = await getMessages(conversationId as number);
          const formatted = msgs.map((m: any) => {
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
            // Mark conversation as read by saving current message count
            try {
              const key = "chat_read_state";
              const raw = await AsyncStorage.getItem(key);
              const readState = raw ? JSON.parse(raw) : {};
              readState[conversationId.toString()] = msgs.length;
              await AsyncStorage.setItem(key, JSON.stringify(readState));
            } catch {}
          }
        } catch (err: any) {
          console.error("[Conversation] ❌ Failed to fetch messages:", err.message);
        }
      };

      if (conversationId) {
        fetchMessages(); // Initial fetch
        poller = setInterval(fetchMessages, POLL_INTERVAL);
      }

      return () => {
        isMounted = false;
        if (poller) clearInterval(poller);
      };
    }, [conversationId, userId])
  );

  const handleSend = useCallback(async () => {
    if (!input.trim()) {
      return;
    }
    if (!conversationId) {
      console.warn("[Conversation] No conversation ID available yet");
      return;
    }
    const text = input.trim();
    setInput("");
    try {
      // console.log("[Conversation] Sending message to ID:", conversationId);
      // Save message to backend
      const sendResult = await sendMessage(conversationId as number, text);
      // console.log("[Conversation] ✅ Message sent successfully");
      // Fetch updated messages from backend
      const msgs = await getMessages(conversationId as number);
      // console.log("[Conversation] Raw messages after send:", msgs);
      const formatted = msgs.map((m: any) => {
        // console.log("[DEBUG] userId:", userId, "m.sender:", m.sender, "m:", m);
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
      // console.log("[Conversation] Updated messages count:", formatted.length);
      setMessages(formatted);
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || err.response?.data?.error || err.message;
      console.error("❌ Failed to send message:", errMsg);
    }
  }, [input, conversationId]);

  return (
    <>
      {/* ✅ Dynamic header */}
      <Stack.Screen
        options={{
          title: name as string,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => (router.canGoBack() ? router.back() : router.push("/(tabs)/chat"))}
              style={{ paddingRight: 10 }}
            >
              <Ionicons name="arrow-back" size={22} color={colors.accent} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <Image
              source={{ uri: avatar as string }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                marginRight: 10,
              }}
            />
          ),
        }}
      />

      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        <View
          className="flex-row items-center justify-between px-5 pt-16 pb-6"
          style={{ backgroundColor: colors.accentLight }}
        >
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => (router.canGoBack() ? router.back() : router.push("/(tabs)/chat"))}
              className="mr-3"
            >
              <ChevronLeft color={colors.textDark} size={28} />
            </TouchableOpacity>
          </View>
        </View>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={90}
        >
          {/* Messages */}
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View className={`px-5 py-2 ${item.sender === "user" ? "items-end" : "items-start"}`}>
                <View
                  className={`max-w-[80%] rounded-2xl px-4 py-2 rounded-br-none`}
                  style={{
                    backgroundColor:
                      item.sender === "user" ? colors.primary : colors.cardBackground,
                    borderBottomRightRadius: item.sender === "user" ? 0 : 16,
                    borderBottomLeftRadius: item.sender === "user" ? 16 : 0,
                  }}
                >
                  <Text
                    className={`text-base ${
                      item.sender === "user" ? "text-white" : "text-gray-800"
                    }`}
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
          {/* Input area */}
          <View
            className="flex-row items-center bg-white px-4 py-4 border-t border-gray-200"
            style={{
              paddingBottom: Platform.OS === "ios" ? 24 : 12, // extra space on iPhones
            }}
          >
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={t("chat.send_message")}
              className="flex-1 bg-gray-100 rounded-full px-4 py-3 text-gray-800"
              style={{
                minHeight: 42, // ensures visibility
              }}
            />
            <TouchableOpacity
              onPress={handleSend}
              className="ml-3 rounded-full p-3"
              style={{ backgroundColor: colors.accent }}
            >
              <Send color={colors.white} size={20} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </>
  );
}
