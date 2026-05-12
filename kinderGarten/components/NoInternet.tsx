import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Linking,
  Platform,
  StatusBar,
} from "react-native";
import { RefreshCw } from "lucide-react-native";
import { useLanguageStore } from "@/store/useLanguageStore";
import { getTranslation } from "@/config/translations";
import { useAppStore } from "@/store/useAppStore";
import { getColors } from "@/config/colors";

const { width, height } = Dimensions.get("window");

function NoInternetIllustration({ color }: { color: string }) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center", marginBottom: 32 }}>
      {/* Wifi signal arcs above the kid */}
      <View style={{ alignItems: "center", marginBottom: 12 }}>
        <View
          style={{
            width: 80,
            height: 40,
            borderTopLeftRadius: 40,
            borderTopRightRadius: 40,
            borderWidth: 3.5,
            borderBottomWidth: 0,
            borderColor: "rgba(255,255,255,0.25)",
          }}
        />
        <View
          style={{
            width: 52,
            height: 26,
            borderTopLeftRadius: 26,
            borderTopRightRadius: 26,
            borderWidth: 3.5,
            borderBottomWidth: 0,
            borderColor: "rgba(255,255,255,0.4)",
            marginTop: -26,
          }}
        />
        <View
          style={{
            width: 28,
            height: 14,
            borderTopLeftRadius: 14,
            borderTopRightRadius: 14,
            borderWidth: 3.5,
            borderBottomWidth: 0,
            borderColor: "rgba(255,255,255,0.6)",
            marginTop: -14,
          }}
        />
        {/* X mark over wifi */}
        <View style={{ position: "absolute", top: -2, right: -8 }}>
          <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "#E74C3C", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#FFF", fontSize: 13, fontWeight: "bold", marginTop: -1 }}>✕</Text>
          </View>
        </View>
      </View>

      {/* Kid character */}
      <View style={{ alignItems: "center", marginTop: 4 }}>
        {/* Head */}
        <View style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: "#FFDAB9",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2,
        }}>
          {/* Hair */}
          <View style={{
            position: "absolute",
            top: -4,
            width: 68,
            height: 36,
            borderTopLeftRadius: 34,
            borderTopRightRadius: 34,
            backgroundColor: "#5D4037",
          }} />
          {/* Left eye */}
          <View style={{ position: "absolute", top: 26, left: 16, width: 7, height: 7, borderRadius: 4, backgroundColor: "#333" }} />
          {/* Right eye */}
          <View style={{ position: "absolute", top: 26, right: 16, width: 7, height: 7, borderRadius: 4, backgroundColor: "#333" }} />
          {/* Sad mouth */}
          <View style={{
            position: "absolute",
            bottom: 12,
            width: 16,
            height: 8,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
            borderWidth: 2,
            borderBottomWidth: 0,
            borderColor: "#333",
            transform: [{ rotate: "180deg" }],
          }} />
          {/* Blush left */}
          <View style={{ position: "absolute", bottom: 16, left: 10, width: 10, height: 6, borderRadius: 3, backgroundColor: "rgba(255,150,150,0.4)" }} />
          {/* Blush right */}
          <View style={{ position: "absolute", bottom: 16, right: 10, width: 10, height: 6, borderRadius: 3, backgroundColor: "rgba(255,150,150,0.4)" }} />
        </View>

        {/* Body (t-shirt) */}
        <View style={{
          width: 72,
          height: 56,
          backgroundColor: "#4FC3F7",
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
          marginTop: -8,
          alignItems: "center",
          zIndex: 1,
        }}>
          {/* Collar */}
          <View style={{
            width: 20,
            height: 10,
            borderBottomLeftRadius: 10,
            borderBottomRightRadius: 10,
            backgroundColor: "#FFDAB9",
            marginTop: 0,
          }} />
        </View>

        {/* Arms */}
        {/* Left arm */}
        <View style={{
          position: "absolute",
          top: 68,
          left: -18,
          width: 22,
          height: 40,
          backgroundColor: "#FFDAB9",
          borderRadius: 10,
          transform: [{ rotate: "15deg" }],
          zIndex: 0,
        }} />
        {/* Right arm */}
        <View style={{
          position: "absolute",
          top: 68,
          right: -18,
          width: 22,
          height: 40,
          backgroundColor: "#FFDAB9",
          borderRadius: 10,
          transform: [{ rotate: "-15deg" }],
          zIndex: 0,
        }} />

        {/* Legs */}
        <View style={{ flexDirection: "row", gap: 8, marginTop: -4, zIndex: 0 }}>
          {/* Left leg */}
          <View style={{
            width: 24,
            height: 36,
            backgroundColor: "#7986CB",
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8,
          }} />
          {/* Right leg */}
          <View style={{
            width: 24,
            height: 36,
            backgroundColor: "#7986CB",
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8,
          }} />
        </View>

        {/* Shoes */}
        <View style={{ flexDirection: "row", gap: 4, marginTop: -2 }}>
          <View style={{ width: 28, height: 12, backgroundColor: "#E53935", borderRadius: 6 }} />
          <View style={{ width: 28, height: 12, backgroundColor: "#E53935", borderRadius: 6 }} />
        </View>
      </View>

      {/* Decorative elements */}
      <View style={{ position: "absolute", top: 10, left: width * 0.12, width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.3)" }} />
      <View style={{ position: "absolute", top: 50, right: width * 0.1, width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.25)" }} />
      <View style={{ position: "absolute", bottom: 40, left: width * 0.15, width: 10, height: 10, borderRadius: 5, backgroundColor: "rgba(255,255,255,0.15)" }} />
      <View style={{ position: "absolute", top: 30, right: width * 0.22, width: 5, height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.2)" }} />
    </View>
  );
}

interface NoInternetProps {
  onRetry?: () => void;
}

export default function NoInternet({ onRetry }: NoInternetProps) {
  const { language } = useLanguageStore();
  const tenant = useAppStore((state) => state.tenant);
  const colors = getColors(tenant?.primary_color, tenant?.secondary_color);
  const t = (key: string) => getTranslation(language, key);

  const bgColor = "#F5A623";

  const openSettings = () => {
    if (Platform.OS === "ios") {
      Linking.openURL("App-Prefs:WIFI");
    } else {
      Linking.openSettings();
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: bgColor,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 40,
      }}
    >
      <StatusBar barStyle="light-content" />

      {/* Illustration */}
      <NoInternetIllustration color={bgColor} />

      {/* Title */}
      <Text
        style={{
          fontSize: 24,
          fontWeight: "bold",
          color: "#FFFFFF",
          textAlign: "center",
          marginBottom: 12,
          writingDirection: language === "ar" ? "rtl" : "ltr",
        }}
      >
        {t("network.no_connection")}
      </Text>

      {/* Description */}
      <Text
        style={{
          fontSize: 15,
          color: "rgba(255,255,255,0.85)",
          textAlign: "center",
          lineHeight: 22,
          marginBottom: 36,
          writingDirection: language === "ar" ? "rtl" : "ltr",
        }}
      >
        {t("network.check_connection")}
      </Text>

      {/* Go to Settings button */}
      <TouchableOpacity
        onPress={openSettings}
        activeOpacity={0.85}
        style={{
          backgroundColor: "#FFFFFF",
          paddingVertical: 14,
          paddingHorizontal: 36,
          borderRadius: 28,
          minWidth: 200,
          alignItems: "center",
          marginBottom: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <Text style={{ color: bgColor, fontSize: 16, fontWeight: "bold" }}>
          {t("network.go_to_settings")}
        </Text>
      </TouchableOpacity>

      {/* Retry button */}
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          activeOpacity={0.7}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingVertical: 12,
          }}
        >
          <RefreshCw size={16} color="rgba(255,255,255,0.8)" />
          <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: "500" }}>
            {t("network.retry")}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
