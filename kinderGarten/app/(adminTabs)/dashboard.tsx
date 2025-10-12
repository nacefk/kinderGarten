import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "@/config/colors";
import { router } from "expo-router";

export default function DashboardScreen() {
  const quickActions = [
    {
      id: "1",
      title: "Enfants",
      icon: "people-outline",
      color: colors.accent,
      screen: "/(adminTabs)/children",
    },
    {
      id: "2",
      title: "Rapports",
      icon: "clipboard-outline",
      color: colors.accent,
      screen: "/(adminTabs)/reports",
    },
    {
      id: "3",
      title: "Calendrier",
      icon: "calendar-outline",
      color: colors.accent,
      screen: "/(adminTabs)/calendar",
    },
    {
      id: "4",
      title: "Messages",
      icon: "chatbubbles-outline",
      color: colors.accent,
      screen: "/(adminTabs)/messages",
    },
  ];

  const stats = [
    { id: "1", label: "Enfants présents", value: 18 },
    { id: "2", label: "Activités du jour", value: 5 },
    { id: "3", label: "Heures supp. en attente", value: 2 },
  ];

  return (
    <ScrollView
      className="flex-1 px-5 pt-4"
      style={{ backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className="mb-6">
        <Text className="text-2xl font-bold mb-1" style={{ color: colors.textDark }}>
          Tableau de Bord
        </Text>
        <Text className="text-base" style={{ color: colors.text }}>
          Résumé quotidien et actions rapides
        </Text>
      </View>
      {/* Logout Button */}
      <TouchableOpacity
        onPress={() => router.replace("/login")}
        style={{
          backgroundColor: colors.accent,
          borderRadius: 14,
          paddingHorizontal: 12,
          paddingVertical: 6,
        }}
      >
        <Text className="text-white text-sm font-medium">Se déconnecter</Text>
      </TouchableOpacity>
      {/* Stats cards */}
      <View className="flex-row flex-wrap justify-between mb-6">
        {stats.map((item) => (
          <View
            key={item.id}
            className="w-[48%] mb-4 rounded-2xl p-5"
            style={{
              backgroundColor: colors.cardBackground,
              shadowColor: "#000",
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Text className="text-sm mb-2" style={{ color: colors.textLight }}>
              {item.label}
            </Text>
            <Text className="text-3xl font-bold" style={{ color: colors.accent }}>
              {item.value}
            </Text>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <Text className="text-lg font-semibold mb-3" style={{ color: colors.textDark }}>
        Actions Rapides
      </Text>
      <View className="flex-row flex-wrap justify-between mb-8">
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            activeOpacity={0.85}
            className="w-[48%] mb-4 rounded-2xl p-5 items-center justify-center"
            style={{
              backgroundColor: colors.cardBackground,
              shadowColor: "#000",
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
            onPress={() => console.log(`Navigate to ${action.screen}`)}
          >
            <Ionicons name={action.icon as any} size={26} color={action.color} />
            <Text className="mt-3 text-base font-medium" style={{ color: colors.textDark }}>
              {action.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Extra Hours Section */}
      <View
        className="rounded-2xl p-5 mb-8"
        style={{
          backgroundColor: colors.cardBackground,
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-lg font-semibold" style={{ color: colors.textDark }}>
            Heures Supplémentaires
          </Text>
          <Ionicons name="time-outline" size={22} color={colors.accent} />
        </View>

        <Text className="text-sm mb-4" style={{ color: colors.text }}>
          2 demandes d’heures supplémentaires sont en attente d’approbation.
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          className="rounded-xl py-3 items-center"
          style={{ backgroundColor: colors.accent }}
          onPress={() => console.log("Navigate to Extra Hours")}
        >
          <Text className="text-white font-medium">Gérer les demandes</Text>
        </TouchableOpacity>
      </View>

      {/* Reports Summary */}
      <View
        className="rounded-2xl p-5 mb-10"
        style={{
          backgroundColor: colors.cardBackground,
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-lg font-semibold" style={{ color: colors.textDark }}>
            Rapports Hebdomadaires
          </Text>
          <Ionicons name="document-text-outline" size={22} color={colors.accent} />
        </View>

        <Text className="text-sm mb-4" style={{ color: colors.text }}>
          Consultez ou exportez les rapports de la semaine (présence, activités, incidents, etc.).
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          className="rounded-xl py-3 items-center"
          style={{ backgroundColor: colors.accent }}
          onPress={() => console.log("Export PDF")}
        >
          <Text className="text-white font-medium">Exporter en PDF</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
