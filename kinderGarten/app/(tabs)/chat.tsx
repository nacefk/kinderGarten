import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  FlatList,
  Platform,
} from "react-native";
import { Send, ChevronLeft } from "lucide-react-native";
import { router } from "expo-router";
import colors from "@/config/colors";

type Message = {
  id: string;
  text: string;
  sender: "user" | "other";
  time: string;
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Salut 👋",
      sender: "other",
      time: "09:00",
    },
    {
      id: "2",
      text: "Bienvenue sur l’écran de discussion !",
      sender: "other",
      time: "09:01",
    },
  ]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMsg: Message = {
      id: Date.now().toString(),
      text: input,
      sender: "user",
      time: new Date().toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
  };

  return (
    <View className="flex-1 bg-[#FAF8F5]">
      {/* En-tête */}
      <View
        className="flex-row items-center justify-between px-5 pt-16 pb-6"
        style={{ backgroundColor: colors.accentLight }}
      >
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ChevronLeft color="#374151" size={28} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
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
                  className={`text-base ${item.sender === "user" ? "text-white" : "text-gray-800"}`}
                >
                  {item.text}
                </Text>
                <Text
                  className={`text-xs mt-1 ${
                    item.sender === "user" ? "text-gray-100 text-right" : "text-gray-400 text-left"
                  }`}
                >
                  {item.time}
                </Text>
              </View>
            </View>
          )}
          contentContainerStyle={{ paddingVertical: 10 }}
        />

        {/* Zone de saisie */}
        <View className="flex-row items-center bg-white px-4 py-3 border-t border-gray-200">
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Écrire un message..."
            className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-gray-800"
          />
          <TouchableOpacity onPress={sendMessage} className="ml-3 bg-[#C6A57B] rounded-full p-2">
            <Send color="#fff" size={20} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
