import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "@/config/colors";
import { useRouter } from "expo-router";
import { useLanguageStore } from "@/store/useLanguageStore";
import { getTranslation } from "@/config/translations";
import HeaderBar from "@/components/Header";
import { getAllExtraHours, approveExtraHour, rejectExtraHour } from "@/api/attendance";

type ExtraHour = {
  id?: number;
  request_id?: number;
  child_name?: string;
  child?: { name: string };
  date?: string;
  created_at?: string;
  request_date?: string;
  createdAt?: string;
  timestamp?: string;
  start?: string;
  end?: string;
  duration?: number;
  status?: "pending" | "approved" | "rejected";
  created_by?: number | null;
};

type GroupedExtraHours = {
  [date: string]: ExtraHour[];
};

export default function ExtraHoursScreen() {
  const router = useRouter();
  const { language } = useLanguageStore();
  const t = (key: string) => getTranslation(language, key);

  const [extraHours, setExtraHours] = useState<ExtraHour[]>([]);
  const [groupedData, setGroupedData] = useState<GroupedExtraHours>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Handle search submission
  const handleSearchSubmit = () => {
    loadExtraHours(false, searchQuery.trim() || undefined);
  };

  // Load extra hours on mount and when refreshing
  const loadExtraHours = async (isRefresh = false, search?: string) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const data = await getAllExtraHours(search);
      // // console.log("[ExtraHoursScreen] Received data:", data);

      // Handle API response - should be an array directly
      let items: ExtraHour[] = [];
      if (Array.isArray(data)) {
        items = data;
        // console.log("[ExtraHoursScreen] Data is array, items:", items);
      } else if (data && typeof data === "object") {
        const results = (data as any).results || (data as any).data || [];
        items = Array.isArray(results) ? results : [];
        // console.log("[ExtraHoursScreen] Data is object, results:", results, "items:", items);
      }

      // console.log("[ExtraHoursScreen] Total items after parsing:", items.length);
      setExtraHours(items);

      // Group by date
      const grouped: GroupedExtraHours = {};
      items.forEach((item) => {
        // Try different possible date field names
        let date =
          item.date ||
          item.request_date ||
          item.created_at ||
          item.createdAt ||
          (item.timestamp ? item.timestamp.split("T")[0] : null);

        // Extract just the date part from ISO timestamp (YYYY-MM-DD)
        if (date && typeof date === "string") {
          date = date.split("T")[0]; // Remove time and timezone info
        }

        if (!date) {
          date = new Date().toISOString().split("T")[0];
        }

        // // console.log("[ExtraHoursScreen] Item date field:", date, "item:", {
        //   child: item.child_name,
        //   status: item.status,
        // });

        if (!grouped[date]) {
          grouped[date] = [];
        }
        grouped[date].push(item);
      });

      // console.log("[ExtraHoursScreen] Grouped data:", Object.keys(grouped));

      // Sort each day by time
      Object.keys(grouped).forEach((date) => {
        grouped[date].sort((a, b) => {
          const timeA = a.start || "00:00";
          const timeB = b.start || "00:00";
          return timeA.localeCompare(timeB);
        });
      });

      // Sort dates in descending order (newest first)
      const sortedDates = Object.keys(grouped).sort().reverse();
      const sortedGrouped: GroupedExtraHours = {};
      sortedDates.forEach((date) => {
        sortedGrouped[date] = grouped[date];
      });

      // console.log("[ExtraHoursScreen] Final grouped data keys:", Object.keys(sortedGrouped));
      setGroupedData(sortedGrouped);
    } catch (err: any) {
      console.error("❌ Error loading extra hours:", err.message);
      Alert.alert("Error", "Failed to load extra hours requests.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load on mount
  useEffect(() => {
    loadExtraHours();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      await approveExtraHour(id);
      setExtraHours((prev) => prev.filter((item) => (item.id ?? item.request_id) !== id));
      // Reload to update grouping
      await loadExtraHours();
    } catch (e: any) {
      const apiMessage = e?.response?.data || e?.message || "";
      console.error("❌ Approve error:", apiMessage);
      let msg = "Unable to approve request.";
      if (typeof apiMessage === "string") {
        if (
          apiMessage.toLowerCase().includes("already approved") ||
          apiMessage.toLowerCase().includes("already rejected")
        ) {
          msg = "This request has already been processed.";
        } else if (apiMessage.toLowerCase().includes("does not exist")) {
          msg = "This request no longer exists.";
        } else if (
          apiMessage.toLowerCase().includes("not allowed") ||
          apiMessage.toLowerCase().includes("permission")
        ) {
          msg = "You do not have permission to approve this request.";
        }
      }
      Alert.alert("Error", msg);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await rejectExtraHour(id);
      setExtraHours((prev) => prev.filter((item) => (item.id ?? item.request_id) !== id));
      // Reload to update grouping
      await loadExtraHours();
    } catch (e: any) {
      const apiMessage = e?.response?.data || e?.message || "";
      console.error("❌ Reject error:", apiMessage);
      let msg = "Unable to reject request.";
      if (typeof apiMessage === "string") {
        if (
          apiMessage.toLowerCase().includes("already approved") ||
          apiMessage.toLowerCase().includes("already rejected")
        ) {
          msg = "This request has already been processed.";
        } else if (apiMessage.toLowerCase().includes("does not exist")) {
          msg = "This request no longer exists.";
        } else if (
          apiMessage.toLowerCase().includes("not allowed") ||
          apiMessage.toLowerCase().includes("permission")
        ) {
          msg = "You do not have permission to reject this request.";
        }
      }
      Alert.alert("Error", msg);
    }
  };

  // Format date to readable format with full day name
  const formatDate = (dateStr: string) => {
    try {
      // Parse the date string (YYYY-MM-DD format)
      const [year, month, day] = dateStr.split("-").map(Number);
      const date = new Date(year, month - 1, day); // month is 0-indexed

      // Get today's date in local timezone
      const today = new Date();
      const todayFormatted = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0"),
      ].join("-");

      // Get yesterday's date in local timezone
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayFormatted = [
        yesterday.getFullYear(),
        String(yesterday.getMonth() + 1).padStart(2, "0"),
        String(yesterday.getDate()).padStart(2, "0"),
      ].join("-");

      // Format day name
      const dayName = date.toLocaleDateString(
        language === "en" ? "en-US" : language === "fr" ? "fr-FR" : "ar-SA",
        {
          weekday: "long",
        }
      );

      if (dateStr === todayFormatted) return `${t("common.today")}, ${dayName}`;
      if (dateStr === yesterdayFormatted) return `${t("common.yesterday")}, ${dayName}`;

      // For other dates, show full format
      return date.toLocaleDateString(
        language === "en" ? "en-US" : language === "fr" ? "fr-FR" : "ar-SA",
        {
          weekday: "long",
          month: "short",
          day: "numeric",
        }
      );
    } catch (err) {
      return dateStr;
    }
  };

  const filteredGroupedData = groupedData;

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      scrollEventThrottle={16}
    >
      {/* Header */}
      <HeaderBar title={t("dashboard.extra_hours")} showBack={true} />

      {/* Search Bar */}
      <View className="px-5 pt-4 pb-3">
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.cardBackground,
            borderRadius: 12,
            paddingHorizontal: 12,
            borderWidth: 1,
            borderColor: colors.accentLight,
          }}
        >
          <Ionicons name="search" size={18} color={colors.textLight} />
          <TextInput
            style={{
              flex: 1,
              paddingVertical: 10,
              paddingHorizontal: 8,
              color: colors.textDark,
              fontSize: 14,
            }}
            placeholder={t("common.search_by_child")}
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingVertical: 80,
          }}
        >
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : Object.keys(filteredGroupedData).length === 0 ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingVertical: 80,
          }}
        >
          <Ionicons
            name="time-outline"
            size={48}
            color={colors.accent}
            style={{ marginBottom: 10 }}
          />
          <Text
            style={{
              color: colors.textLight,
              fontSize: 16,
              textAlign: "center",
            }}
          >
            {t("dashboard.no_requests")}
          </Text>
        </View>
      ) : (
        <View className="px-5 py-6">
          {Object.keys(filteredGroupedData).map((date, dateIndex) => (
            <View key={date} className="mb-6">
              {/* Date Group Header - More Prominent */}
              <View style={{ marginBottom: 12 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 10,
                    paddingHorizontal: 4,
                    borderBottomWidth: 2,
                    borderBottomColor: colors.accent,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 17,
                      fontWeight: "700",
                      color: colors.textDark,
                      flex: 1,
                    }}
                  >
                    {formatDate(date)}
                  </Text>
                  <View
                    style={{
                      backgroundColor: colors.accent,
                      borderRadius: 12,
                      paddingVertical: 4,
                      paddingHorizontal: 10,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.white,
                        fontSize: 12,
                        fontWeight: "600",
                      }}
                    >
                      {filteredGroupedData[date].length}{" "}
                      {t(
                        filteredGroupedData[date].length === 1
                          ? "common.request"
                          : "common.requests"
                      )}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Requests for this day */}
              {filteredGroupedData[date].map((req) => {
                const id = req.id || req.request_id;
                if (!id) return null; // Skip if no ID
                const childName =
                  typeof req.child === "string"
                    ? req.child
                    : req.child?.name || req.child_name || "Unknown";
                const duration = req.duration || 0;

                return (
                  <View
                    key={id}
                    className="rounded-xl p-4 mb-3 flex-row items-stretch justify-between"
                    style={{
                      backgroundColor: colors.cardBackground,
                      shadowColor: colors.shadow,
                      shadowOpacity: 0.05,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    {/* Left side: Child name */}
                    <View style={{ flex: 1, justifyContent: "center" }}>
                      <Text
                        className="font-semibold"
                        style={{ color: colors.textDark, fontSize: 15 }}
                      >
                        {childName}
                      </Text>
                    </View>

                    {/* Right side: Stacked (Duration on top, Status & Actions below) */}
                    <View
                      style={{
                        flexDirection: "column",
                        marginLeft: 12,
                        gap: 6,
                        justifyContent: "space-between",
                      }}
                    >
                      {/* Duration Badge - Top */}
                      <View
                        style={{
                          backgroundColor: colors.accentLight,
                          borderRadius: 8,
                          paddingVertical: 4,
                          paddingHorizontal: 8,
                          alignSelf: "flex-end",
                        }}
                      >
                        <Text
                          style={{
                            color: colors.accent,
                            fontSize: 11,
                            fontWeight: "600",
                          }}
                        >
                          {duration} min
                        </Text>
                      </View>

                      {/* Status & Actions Row - Bottom */}
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        {/* Status Badge */}
                        {req.status && (
                          <View
                            style={{
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 6,
                              backgroundColor:
                                req.status === "approved"
                                  ? colors.successLight
                                  : req.status === "rejected"
                                    ? colors.errorLight
                                    : colors.warningLighter,
                            }}
                          >
                            <Text
                              style={{
                                color:
                                  req.status === "approved"
                                    ? colors.successDarkText
                                    : req.status === "rejected"
                                      ? colors.errorDarkText
                                      : colors.warningDarkText,
                                fontSize: 11,
                                fontWeight: "600",
                                textTransform: "capitalize",
                              }}
                            >
                              {t(`common.${req.status}`)}
                            </Text>
                          </View>
                        )}

                        {/* Action buttons */}
                        {req.status === "pending" && (
                          <View className="flex-row" style={{ gap: 6 }}>
                            {/* Approve */}
                            <TouchableOpacity
                              onPress={() => handleApprove(id)}
                              className="rounded-lg"
                              style={{ backgroundColor: colors.successDark, padding: 6 }}
                              activeOpacity={0.8}
                            >
                              <Ionicons name="checkmark" size={16} color={colors.white} />
                            </TouchableOpacity>

                            {/* Reject */}
                            <TouchableOpacity
                              onPress={() => handleReject(id)}
                              className="rounded-lg"
                              style={{ backgroundColor: colors.errorDark, padding: 6 }}
                              activeOpacity={0.8}
                            >
                              <Ionicons name="close" size={16} color={colors.white} />
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
