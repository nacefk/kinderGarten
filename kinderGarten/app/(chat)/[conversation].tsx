import React, { useState } from "react";
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
import colors from "@/config/colors";
import { useLanguageStore } from "@/store/useLanguageStore";
import { getTranslation } from "@/config/translations";

type Message = {
  id: string;
  text: string;
  sender: "user" | "other";
  time: string;
};

export default function ConversationScreen() {
  const { id, name, avatar } = useLocalSearchParams();
  const { language } = useLanguageStore();
  const t = (key: string) => getTranslation(language, key);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: `Bonjour ${name}! 👋`,
      sender: "other",
      time: "9:00 AM",
    },
  ]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMsg: Message = {
      id: Date.now().toString(),
      text: input,
      sender: "user",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
  };

  return (
    <>
      {/* ✅ Dynamic header */}
      <Stack.Screen
        options={{
          title: name as string,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 10 }}>
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

      <View className="flex-1 bg-[#FAF8F5]">
        <View
          className="flex-row items-center justify-between px-5 pt-16 pb-6"
          style={{ backgroundColor: colors.accentLight }}
        >
          {" "}
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <ChevronLeft color="#374151" size={28} />
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
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    item.sender === "user"
                      ? "bg-[#C6A57B] rounded-br-none"
                      : "bg-white rounded-bl-none"
                  }`}
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
            <TouchableOpacity onPress={sendMessage} className="ml-3 bg-[#C6A57B] rounded-full p-3">
              <Send color="#fff" size={20} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </>
  );
}
