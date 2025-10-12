import React from "react";
import { View, Text, FlatList, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import colors from "@/config/colors";

type ParentPreview = {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  avatar: string;
  unread: number;
};

export default function ChatListScreen() {
  const router = useRouter();

  const parents: ParentPreview[] = [
    {
      id: "1",
      name: "Sophie Dupont",
      lastMessage: "Merci pour les photos 😊",
      time: "09:45",
      avatar: "https://i.pravatar.cc/150?img=5",
      unread: 2,
    },
    {
      id: "2",
      name: "Paul Martin",
      lastMessage: "Liam a oublié son doudou 🧸",
      time: "08:22",
      avatar: "https://i.pravatar.cc/150?img=15",
      unread: 0,
    },
  ];

  const renderParent = ({ item }: { item: ParentPreview }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      // ✅ navigate to (chat)/[conversation].tsx
      onPress={() =>
        router.push({
          pathname: "/(chat)/:conversation",
          params: {
            id: item.id,
            name: item.name,
            avatar: item.avatar,
          },
        })
      }
      className="flex-row items-center mb-4 p-3 rounded-2xl"
      style={{
        backgroundColor: colors.cardBackground,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <Image source={{ uri: item.avatar }} className="w-12 h-12 rounded-full mr-3" />

      <View className="flex-1">
        <Text className="text-base font-semibold" style={{ color: colors.textDark }}>
          {item.name}
        </Text>
        <Text className="text-sm mt-1" style={{ color: colors.textLight }} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>

      <View className="items-end">
        <Text className="text-xs mb-1" style={{ color: colors.textLight }}>
          {item.time}
        </Text>
        {item.unread > 0 && (
          <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: "#C6A57B" }}>
            <Text className="text-white text-xs font-medium">{item.unread}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 px-5 pt-4" style={{ backgroundColor: colors.background }}>
      <Text className="text-2xl font-bold mb-6" style={{ color: colors.textDark }}>
        Messages
      </Text>

      <FlatList
        data={parents}
        keyExtractor={(item) => item.id}
        renderItem={renderParent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
