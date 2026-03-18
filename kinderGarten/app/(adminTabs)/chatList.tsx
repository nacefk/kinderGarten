import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getColors } from "@/config/colors";
import { useAppStore } from "@/store/useAppStore";
import { ChevronLeft } from "lucide-react-native";
import HeaderBar from "@/components/Header";
import { getConversations, deleteConversation } from "@/api/chat";

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
  const tenant = useAppStore((state) => state.tenant);
  const colors = getColors(tenant?.primary_color, tenant?.secondary_color);

  const [conversations, setConversations] = useState<ParentPreview[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const data = await getConversations();
      // // console.log("[Conversations API] Raw data:", data);
      // Map API data to ParentPreview type (handle paginated response)
      const mapped = (data.results || []).map((conv: any) => ({
        id: conv.id?.toString() || "",
        name: conv.other_user_name || conv.name || conv.parent_name || "Parent inconnu",
        lastMessage: conv.last_message?.text || "",
        time: conv.last_message?.timestamp
          ? new Date(conv.last_message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "",
        avatar: conv.other_user_avatar || "https://i.pravatar.cc/150?img=5",
        unread: conv.unread_count || 0,
      }));
      // console.log("[Conversations] Mapped:", mapped);
      setConversations(mapped);
    } catch (e) {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const renderParent = ({ item }: { item: ParentPreview }) => (
    <TouchableOpacity
      activeOpacity={0.8}
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
      onLongPress={() => {
        Alert.alert(
          "Supprimer la conversation",
          `Voulez-vous supprimer la conversation avec ${item.name} ?`,
          [
            { text: "Annuler", style: "cancel" },
            {
              text: "Supprimer",
              style: "destructive",
              onPress: async () => {
                await deleteConversation(item.id);
                fetchConversations();
              },
            },
          ]
        );
      }}
      className="flex-row items-center mb-4 p-3 rounded-2xl mx-5"
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
          <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: colors.primary }}>
            <Text className="text-white text-xs font-medium">{item.unread}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 " style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <HeaderBar title="Messagerie" showBack={true} />

      <Text className="text-2xl font-bold mb-6 mx-5 mt-4" style={{ color: colors.textDark }}>
        Messages
      </Text>

      {loading ? (
        <Text className="mx-5 mt-10 text-gray-500">Chargement des conversations...</Text>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderParent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
