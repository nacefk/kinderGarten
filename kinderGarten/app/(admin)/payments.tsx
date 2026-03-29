import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useLanguageStore } from "@/store/useLanguageStore";
import { useAppStore } from "@/store/useAppStore";
import { getTranslation } from "@/config/translations";
import { getColors } from "@/config/colors";
import HeaderBar from "@/components/Header";
import { getAllPayments, updatePayment, Payment, PaymentStatus } from "@/api/payment";

type FilterKey = "all" | PaymentStatus;

const STATUS_ICONS: Record<PaymentStatus, { name: keyof typeof Ionicons.glyphMap; color: string }> =
  {
    pending: { name: "time-outline", color: "#F59E0B" },
    completed: { name: "checkmark-circle-outline", color: "#16A34A" },
    failed: { name: "close-circle-outline", color: "#DC2626" },
    cancelled: { name: "ban-outline", color: "#6B7280" },
  };

export default function PaymentsScreen() {
  const router = useRouter();
  const { language } = useLanguageStore();
  const tenant = useAppStore((state) => state.tenant);
  const colors = getColors(tenant?.primary_color, tenant?.secondary_color);
  const t = (key: string) => getTranslation(language, key);

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Edit modal state
  const [editPayment, setEditPayment] = useState<Payment | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editStatus, setEditStatus] = useState<PaymentStatus>("pending");
  const [saving, setSaving] = useState(false);

  const openEdit = (payment: Payment) => {
    setEditPayment(payment);
    setEditDate(payment.date_of_payment);
    setEditAmount("");
    setEditStatus(payment.status);
  };

  const handleSave = async () => {
    if (!editPayment) return;
    try {
      setSaving(true);
      await updatePayment(editPayment.id, {
        child: editPayment.child,
        date_of_payment: editDate,
        amount: editAmount,
        status: editStatus,
      });
      setEditPayment(null);
      loadPayments();
    } catch (err: any) {
      Alert.alert(t("common.error"), err?.response?.data?.detail || err.message);
    } finally {
      setSaving(false);
    }
  };

  const editableStatuses: PaymentStatus[] = ["pending", "completed"];

  const filters: { key: FilterKey; label: string }[] = [
    { key: "all", label: t("payments.filter_all") },
    { key: "pending", label: t("payments.filter_pending") },
    { key: "completed", label: t("payments.filter_completed") },
  ];

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const data = await getAllPayments();
      setPayments(data);
    } catch (err: any) {
      console.error("❌ Error loading payments:", err?.message || err);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  // Group payments by child, keeping latest payment per child
  const childPayments = useMemo(() => {
    let filtered = payments;

    // Filter by status
    if (activeFilter !== "all") {
      filtered = filtered.filter((p) => p.status === activeFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((p) => p.child_name?.toLowerCase().includes(q));
    }

    // Group by child — keep the most recent payment per child
    const childMap = new Map<number, Payment>();
    filtered.forEach((p) => {
      const existing = childMap.get(p.child);
      if (!existing || p.date_of_payment > existing.date_of_payment) {
        childMap.set(p.child, p);
      }
    });

    return Array.from(childMap.values()).sort((a, b) => a.child_name.localeCompare(b.child_name));
  }, [payments, activeFilter, searchQuery]);

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case "completed":
        return colors.success;
      case "pending":
        return "#F59E0B";
      case "failed":
        return colors.error;
      case "cancelled":
        return colors.mediumGray;
      default:
        return colors.text;
    }
  };

  const getStatusLabel = (status: PaymentStatus) => {
    switch (status) {
      case "pending":
        return t("payments.filter_pending");
      case "completed":
        return t("payments.filter_completed");
      case "failed":
        return t("payments.filter_failed");
      case "cancelled":
        return t("payments.filter_cancelled");
      default:
        return status;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <HeaderBar title={t("payments.title")} showBack onBackPress={() => router.back()} />

      {/* Search Bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.lightGray,
          borderRadius: 12,
          marginHorizontal: 20,
          marginTop: 12,
          paddingHorizontal: 12,
          height: 40,
        }}
      >
        <Ionicons name="search-outline" size={18} color={colors.mediumGray} />
        <TextInput
          style={{
            flex: 1,
            marginLeft: 8,
            fontSize: 14,
            color: colors.textDark,
          }}
          placeholder={t("payments.search_placeholder")}
          placeholderTextColor={colors.mediumGray}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color={colors.mediumGray} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 20,
          marginTop: 8,
          marginBottom: 8,
        }}
      >
        {filters.map((f) => {
          const isActive = activeFilter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setActiveFilter(f.key)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 14,
                backgroundColor: isActive ? colors.accent || "#C6A57B" : colors.lightGray,
                marginRight: 8,
              }}
            >
              <Text
                style={{
                  color: isActive ? "#fff" : colors.textDark,
                  fontWeight: "600",
                  fontSize: 12,
                }}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Payment List */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={colors.accent || "#C6A57B"} size="large" />
        </View>
      ) : childPayments.length === 0 ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40 }}
        >
          <Ionicons
            name="receipt-outline"
            size={48}
            color={colors.mediumGray}
            style={{ marginBottom: 12 }}
          />
          <Text style={{ color: colors.textLight, textAlign: "center", fontSize: 16 }}>
            {t("payments.no_payments")}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {childPayments.map((payment) => {
            const initials = payment.child_name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            const statusInfo = STATUS_ICONS[payment.status];
            const statusColor = getStatusColor(payment.status);

            return (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => openEdit(payment)}
                key={`${payment.child}-${payment.id}`}
                style={{
                  backgroundColor: colors.cardBackground,
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 12,
                  shadowColor: "#000",
                  shadowOpacity: 0.04,
                  shadowRadius: 4,
                  elevation: 1,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                {/* Avatar */}
                {payment.child_avatar ? (
                  <Image
                    source={{ uri: payment.child_avatar }}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      marginRight: 14,
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: colors.accentLight,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 14,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.accent || "#C6A57B",
                        fontWeight: "bold",
                        fontSize: 16,
                      }}
                    >
                      {initials}
                    </Text>
                  </View>
                )}

                {/* Info */}
                <View style={{ flex: 1 }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      color: colors.textDark,
                      fontWeight: "700",
                      fontSize: 15,
                    }}
                  >
                    {payment.child_name}
                  </Text>

                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                    <Ionicons name="calendar-outline" size={14} color={colors.mediumGray} />
                    <Text style={{ color: colors.textLight, fontSize: 13, marginLeft: 4 }}>
                      {payment.date_of_payment}
                    </Text>
                  </View>

                </View>

                {/* Amount + Status */}
                <View style={{ alignItems: "flex-end" }}>
                  <Text
                    style={{
                      color: colors.textDark,
                      fontWeight: "700",
                      fontSize: 15,
                    }}
                  >
                    {parseFloat(payment.amount).toString()} {t("payments.currency")}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginTop: 4,
                      backgroundColor: `${statusColor}18`,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 10,
                    }}
                  >
                    <Ionicons name={statusInfo.name} size={14} color={statusColor} />
                    <Text
                      style={{
                        color: statusColor,
                        fontSize: 11,
                        fontWeight: "600",
                        marginLeft: 4,
                      }}
                    >
                      {getStatusLabel(payment.status)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Edit Payment Modal */}
      <Modal visible={!!editPayment} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: colors.overlayDark,
            paddingHorizontal: 24,
          }}
        >
          <View
            style={{
              width: "100%",
              backgroundColor: colors.cardBackground,
              borderRadius: 20,
              padding: 24,
            }}
          >
            {/* Modal Title */}
            <Text
              style={{
                color: colors.textDark,
                fontWeight: "700",
                fontSize: 18,
                marginBottom: 4,
              }}
            >
              {editPayment?.child_name}
            </Text>
            <Text style={{ color: colors.textLight, fontSize: 13, marginBottom: 20 }}>
              {t("common.edit")} {t("payments.title").toLowerCase()}
            </Text>

            {/* Date Field */}
            <Text style={{ color: colors.textDark, fontWeight: "600", fontSize: 13, marginBottom: 6 }}>
              {t("payments.date")}
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.lightGray,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 14,
                color: colors.textDark,
                marginBottom: 14,
              }}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.mediumGray}
              value={editDate}
              onChangeText={setEditDate}
            />

            {/* Amount Field */}
            <Text style={{ color: colors.textDark, fontWeight: "600", fontSize: 13, marginBottom: 6 }}>
              {t("payments.amount")} ({t("payments.currency")})
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.lightGray,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 14,
                color: colors.textDark,
                marginBottom: 14,
              }}
              placeholder="0"
              placeholderTextColor={colors.mediumGray}
              keyboardType="number-pad"
              value={editAmount}
              onChangeText={(text) => {
                // Allow only whole numbers
                if (/^\d*$/.test(text)) {
                  setEditAmount(text);
                }
              }}
            />

            {/* Status Selector */}
            <Text style={{ color: colors.textDark, fontWeight: "600", fontSize: 13, marginBottom: 8 }}>
              {t("payments.status")}
            </Text>
            <View style={{ flexDirection: "row", marginBottom: 20 }}>
              {editableStatuses.map((s) => {
                const isActive = editStatus === s;
                const sColor = getStatusColor(s);
                return (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setEditStatus(s)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 12,
                      backgroundColor: isActive ? `${sColor}20` : colors.lightGray,
                      borderWidth: isActive ? 1.5 : 0,
                      borderColor: isActive ? sColor : "transparent",
                      marginRight: 10,
                    }}
                  >
                    <Ionicons name={STATUS_ICONS[s].name} size={16} color={sColor} />
                    <Text style={{ color: sColor, fontWeight: "600", fontSize: 13, marginLeft: 6 }}>
                      {getStatusLabel(s)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Action Buttons */}
            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <TouchableOpacity
                onPress={() => setEditPayment(null)}
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 10,
                  marginRight: 10,
                }}
              >
                <Text style={{ color: colors.textLight, fontWeight: "600", fontSize: 14 }}>
                  {t("common.cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                style={{
                  paddingHorizontal: 24,
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: colors.accent || "#C6A57B",
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}>
                    {t("common.save")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
