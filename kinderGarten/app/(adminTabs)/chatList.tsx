import React, { useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getColors } from "@/config/colors";
import { useAppStore } from "@/store/useAppStore";
import HeaderBar from "@/components/Header";
import { getConversations, deleteConversation } from "@/api/chat";
import { getChildren } from "@/api/children";

const READ_STORAGE_KEY = "chat_read_state";

type ChildInfo = {
  name: string;
  avatar: string | null;
};

type ParentPreview = {
  id: string;
  name: string;
  time: string;
  avatar: string;
  unread: boolean;
  child: ChildInfo | null;
};

export default function ChatListScreen() {
  const router = useRouter();
  const tenant = useAppStore((state) => state.tenant);
  const colors = getColors(tenant?.primary_color, tenant?.secondary_color);

  const [conversations, setConversations] = useState<ParentPreview[]>([]);
  const [loading, setLoading] = useState(true);

  const getReadState = async (): Promise<Record<string, number>> => {
    try {
      const raw = await AsyncStorage.getItem(READ_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const [data, childrenData, readState] = await Promise.all([
        getConversations(),
        getChildren(),
        getReadState(),
      ]);
      const children = Array.isArray(childrenData) ? childrenData : [];

      // Build lookup: parent_name / parent_user_name -> child
      const parentChildMap = new Map<string, ChildInfo>();
      for (const c of children) {
        if (c.parent_name) {
          parentChildMap.set(c.parent_name.toLowerCase(), {
            name: c.name,
            avatar: c.avatar || null,
          });
        }
        if (c.parent_user_name) {
          parentChildMap.set(c.parent_user_name.toLowerCase(), {
            name: c.name,
            avatar: c.avatar || null,
          });
        }
      }

      const mapped = (data.results || []).map((conv: any) => {
        const parentName =
          conv.other_user_name || conv.name || conv.parent_name || "Parent inconnu";
        const childMatch =
          parentChildMap.get(parentName.toLowerCase()) ||
          parentChildMap.get((conv.other_user_username || "").toLowerCase()) ||
          null;

        const convId = conv.id?.toString() || "";
        const messageCount = conv.message_count ?? conv.messages_count ?? 0;
        const lastReadCount = readState[convId] ?? 0;
        const hasUnread = messageCount > lastReadCount || (conv.unread_count ?? 0) > 0;

        return {
          id: convId,
          name: parentName,
          time: conv.last_message?.timestamp
            ? new Date(conv.last_message.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "",
          avatar: conv.other_user_avatar || "",
          unread: hasUnread,
          child: childMatch,
        };
      });
      setConversations(mapped);
    } catch (e) {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  // Refresh conversations every time the screen is focused (coming back from chat)
  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [])
  );

  const renderParent = ({ item }: { item: ParentPreview }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() =>
        router.push({
          pathname: "/(chat)/:conversation",
          params: {
            id: item.id,
            name: item.child?.name || item.name,
            avatar: item.child?.avatar || item.avatar,
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
      {item.child?.avatar ? (
        <Image source={{ uri: item.child.avatar }} className="w-12 h-12 rounded-full mr-3" />
      ) : (
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: colors.accentLight,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <Ionicons name="person-outline" size={24} color={colors.mediumGray} />
        </View>
      )}

      <View className="flex-1 justify-center">
        <Text className="text-base font-semibold" style={{ color: colors.textDark }}>
          {item.child?.name || item.name}
        </Text>
      </View>

      <View className="items-end">
        <Text className="text-xs mb-1" style={{ color: colors.textLight }}>
          {item.time}
        </Text>
        {item.unread && (
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: colors.accent || "#C6A57B",
              marginTop: 4,
            }}
          />
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
