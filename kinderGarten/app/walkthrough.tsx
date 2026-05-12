import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StatusBar,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  Home,
  CalendarDays,
  MessageCircle,
  User,
  Clock,
  Camera,
  Smile,
  Utensils,
  Moon,
  Heart,
  Star,
  Bell,
  BookOpen,
  Music,
  Palette,
  Send,
  Shield,
  Phone,
  FileText,
  Image as ImageIcon,
  Play,
  Download,
  ClipboardList,
  Baby,
} from "lucide-react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLanguageStore } from "@/store/useLanguageStore";
import { getTranslation } from "@/config/translations";
import { useAppStore } from "@/store/useAppStore";
import { getColors } from "@/config/colors";

const { width, height } = Dimensions.get("window");
const WALKTHROUGH_KEY = "kindergarten_walkthrough_seen";

// ─── Illustration Components ─────────────────────────────────────────────────

function WelcomeIllustration() {
  return (
    <View style={{ width: width * 0.85, height: height * 0.42, alignItems: "center", justifyContent: "center" }}>
      {/* Background shapes */}
      <View style={{ position: "absolute", top: 20, left: 30, width: 80, height: 80, borderRadius: 40, backgroundColor: "#FFF3E0", opacity: 0.7 }} />
      <View style={{ position: "absolute", top: 60, right: 40, width: 50, height: 50, borderRadius: 25, backgroundColor: "#E8F5E9", opacity: 0.7 }} />
      <View style={{ position: "absolute", bottom: 40, left: 50, width: 60, height: 60, borderRadius: 30, backgroundColor: "#E3F2FD", opacity: 0.7 }} />
      <View style={{ position: "absolute", bottom: 80, right: 30, width: 40, height: 40, borderRadius: 20, backgroundColor: "#FCE4EC", opacity: 0.7 }} />

      {/* Main card */}
      <View style={{
        width: 220, height: 260, backgroundColor: "#FFFFFF", borderRadius: 24,
        shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24,
        elevation: 8, alignItems: "center", justifyContent: "center", padding: 20,
      }}>
        {/* School building */}
        <View style={{
          width: 100, height: 80, backgroundColor: "#FFF8E1", borderRadius: 16,
          alignItems: "center", justifyContent: "center", marginBottom: 12,
        }}>
          <Ionicons name="school" size={48} color="#C6A57B" />
        </View>
        {/* Children icons */}
        <View style={{ flexDirection: "row", gap: 16, marginTop: 8 }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#E8F5E9", alignItems: "center", justifyContent: "center" }}>
            <Baby size={24} color="#4CAF50" />
          </View>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#E3F2FD", alignItems: "center", justifyContent: "center" }}>
            <Heart size={24} color="#2196F3" />
          </View>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#FCE4EC", alignItems: "center", justifyContent: "center" }}>
            <Star size={24} color="#E91E63" />
          </View>
        </View>
      </View>

      {/* Floating elements */}
      <View style={{ position: "absolute", top: 30, right: 60, width: 48, height: 48, borderRadius: 14, backgroundColor: "#FFF", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, alignItems: "center", justifyContent: "center" }}>
        <Bell size={22} color="#FF9800" />
      </View>
      <View style={{ position: "absolute", bottom: 50, left: 30, width: 48, height: 48, borderRadius: 14, backgroundColor: "#FFF", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, alignItems: "center", justifyContent: "center" }}>
        <Smile size={22} color="#4CAF50" />
      </View>
    </View>
  );
}

function DailyReportIllustration() {
  return (
    <View style={{ width: width * 0.85, height: height * 0.42, alignItems: "center", justifyContent: "center" }}>
      <View style={{ position: "absolute", top: 10, left: 20, width: 70, height: 70, borderRadius: 35, backgroundColor: "#E8F5E9", opacity: 0.6 }} />
      <View style={{ position: "absolute", bottom: 30, right: 25, width: 55, height: 55, borderRadius: 28, backgroundColor: "#FFF3E0", opacity: 0.6 }} />

      {/* Main report card */}
      <View style={{
        width: 240, backgroundColor: "#FFFFFF", borderRadius: 20,
        shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 20,
        elevation: 8, padding: 20, gap: 14,
      }}>
        {/* Header bar */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#E8F5E9", alignItems: "center", justifyContent: "center" }}>
            <ClipboardList size={20} color="#4CAF50" />
          </View>
          <View>
            <View style={{ width: 80, height: 10, backgroundColor: "#F0F0F0", borderRadius: 5 }} />
            <View style={{ width: 50, height: 8, backgroundColor: "#F5F5F5", borderRadius: 4, marginTop: 4 }} />
          </View>
        </View>

        {/* Mood row */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#FFF8E1", borderRadius: 12, padding: 12 }}>
          <Smile size={22} color="#FF9800" />
          <View style={{ flex: 1 }}>
            <View style={{ width: 60, height: 8, backgroundColor: "#FFE0B2", borderRadius: 4 }} />
            <View style={{ width: 90, height: 6, backgroundColor: "#FFF3E0", borderRadius: 3, marginTop: 4 }} />
          </View>
          <Text style={{ fontSize: 20 }}>😊</Text>
        </View>

        {/* Meal row */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#E8F5E9", borderRadius: 12, padding: 12 }}>
          <Utensils size={22} color="#4CAF50" />
          <View style={{ flex: 1 }}>
            <View style={{ width: 50, height: 8, backgroundColor: "#C8E6C9", borderRadius: 4 }} />
            <View style={{ width: 80, height: 6, backgroundColor: "#E8F5E9", borderRadius: 3, marginTop: 4 }} />
          </View>
          <Text style={{ fontSize: 20 }}>🍽️</Text>
        </View>

        {/* Nap row */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#E3F2FD", borderRadius: 12, padding: 12 }}>
          <Moon size={22} color="#2196F3" />
          <View style={{ flex: 1 }}>
            <View style={{ width: 40, height: 8, backgroundColor: "#BBDEFB", borderRadius: 4 }} />
            <View style={{ width: 70, height: 6, backgroundColor: "#E3F2FD", borderRadius: 3, marginTop: 4 }} />
          </View>
          <Text style={{ fontSize: 20 }}>💤</Text>
        </View>
      </View>

      {/* Floating element */}
      <View style={{ position: "absolute", top: 40, right: 30, width: 50, height: 50, borderRadius: 15, backgroundColor: "#FFF", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, alignItems: "center", justifyContent: "center" }}>
        <FileText size={24} color="#C6A57B" />
      </View>
    </View>
  );
}

function ActivityIllustration() {
  return (
    <View style={{ width: width * 0.85, height: height * 0.42, alignItems: "center", justifyContent: "center" }}>
      <View style={{ position: "absolute", top: 15, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: "#E3F2FD", opacity: 0.6 }} />
      <View style={{ position: "absolute", bottom: 20, left: 35, width: 50, height: 50, borderRadius: 25, backgroundColor: "#EDE7F6", opacity: 0.6 }} />

      {/* Calendar card */}
      <View style={{
        width: 240, backgroundColor: "#FFFFFF", borderRadius: 20,
        shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 20,
        elevation: 8, overflow: "hidden",
      }}>
        {/* Calendar header */}
        <View style={{ backgroundColor: "#2196F3", paddingVertical: 16, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <CalendarDays size={22} color="#FFF" />
          <Text style={{ color: "#FFF", fontWeight: "bold", fontSize: 16 }}>📅</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Time slots */}
        <View style={{ padding: 16, gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={{ fontSize: 11, color: "#9E9E9E", width: 42 }}>09:00</Text>
            <View style={{ flex: 1, backgroundColor: "#E8F5E9", borderRadius: 8, padding: 10, flexDirection: "row", alignItems: "center", gap: 8 }}>
              <BookOpen size={16} color="#4CAF50" />
              <View style={{ width: 60, height: 7, backgroundColor: "#C8E6C9", borderRadius: 4 }} />
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={{ fontSize: 11, color: "#9E9E9E", width: 42 }}>10:30</Text>
            <View style={{ flex: 1, backgroundColor: "#FFF3E0", borderRadius: 8, padding: 10, flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Music size={16} color="#FF9800" />
              <View style={{ width: 50, height: 7, backgroundColor: "#FFE0B2", borderRadius: 4 }} />
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={{ fontSize: 11, color: "#9E9E9E", width: 42 }}>14:00</Text>
            <View style={{ flex: 1, backgroundColor: "#EDE7F6", borderRadius: 8, padding: 10, flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Palette size={16} color="#7C4DFF" />
              <View style={{ width: 55, height: 7, backgroundColor: "#D1C4E9", borderRadius: 4 }} />
            </View>
          </View>
        </View>
      </View>

      {/* Floating star */}
      <View style={{ position: "absolute", top: 25, left: 40, width: 46, height: 46, borderRadius: 14, backgroundColor: "#FFF", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, alignItems: "center", justifyContent: "center" }}>
        <Star size={22} color="#FFB300" />
      </View>
    </View>
  );
}

function MediaIllustration() {
  return (
    <View style={{ width: width * 0.85, height: height * 0.42, alignItems: "center", justifyContent: "center" }}>
      <View style={{ position: "absolute", top: 20, left: 25, width: 65, height: 65, borderRadius: 32, backgroundColor: "#F3E5F5", opacity: 0.6 }} />
      <View style={{ position: "absolute", bottom: 25, right: 30, width: 45, height: 45, borderRadius: 22, backgroundColor: "#E8F5E9", opacity: 0.6 }} />

      {/* Photo gallery card */}
      <View style={{
        width: 250, backgroundColor: "#FFFFFF", borderRadius: 20,
        shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 20,
        elevation: 8, padding: 16,
      }}>
        {/* Photo grid */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
          <View style={{ flex: 1, height: 100, backgroundColor: "#E1BEE7", borderRadius: 12, alignItems: "center", justifyContent: "center" }}>
            <ImageIcon size={28} color="#9C27B0" />
            <Text style={{ fontSize: 24, marginTop: 4 }}>🎨</Text>
          </View>
          <View style={{ flex: 1, height: 100, backgroundColor: "#B2DFDB", borderRadius: 12, alignItems: "center", justifyContent: "center" }}>
            <ImageIcon size={28} color="#009688" />
            <Text style={{ fontSize: 24, marginTop: 4 }}>🌿</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View style={{ flex: 1, height: 80, backgroundColor: "#FFECB3", borderRadius: 12, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 28 }}>🧸</Text>
          </View>
          <View style={{ flex: 1, height: 80, backgroundColor: "#C8E6C9", borderRadius: 12, alignItems: "center", justifyContent: "center", position: "relative" }}>
            <Play size={28} color="#4CAF50" />
            <View style={{ position: "absolute", bottom: 6, right: 6, width: 20, height: 20, borderRadius: 10, backgroundColor: "#4CAF50", alignItems: "center", justifyContent: "center" }}>
              <Play size={10} color="#FFF" />
            </View>
          </View>
          <View style={{ flex: 1, height: 80, backgroundColor: "#BBDEFB", borderRadius: 12, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 28 }}>🎶</Text>
          </View>
        </View>

        {/* Download hint */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 12, gap: 6 }}>
          <Download size={14} color="#9E9E9E" />
          <View style={{ width: 80, height: 6, backgroundColor: "#F0F0F0", borderRadius: 3 }} />
        </View>
      </View>

      {/* Floating camera */}
      <View style={{ position: "absolute", top: 30, right: 35, width: 50, height: 50, borderRadius: 15, backgroundColor: "#FFF", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, alignItems: "center", justifyContent: "center" }}>
        <Camera size={24} color="#9C27B0" />
      </View>
    </View>
  );
}

function ChatIllustration() {
  return (
    <View style={{ width: width * 0.85, height: height * 0.42, alignItems: "center", justifyContent: "center" }}>
      <View style={{ position: "absolute", top: 25, right: 35, width: 55, height: 55, borderRadius: 28, backgroundColor: "#FFF3E0", opacity: 0.6 }} />
      <View style={{ position: "absolute", bottom: 35, left: 30, width: 50, height: 50, borderRadius: 25, backgroundColor: "#E3F2FD", opacity: 0.6 }} />

      {/* Chat card */}
      <View style={{
        width: 250, backgroundColor: "#FFFFFF", borderRadius: 20,
        shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 20,
        elevation: 8, padding: 20, gap: 12,
      }}>
        {/* Received message */}
        <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-end" }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#FF9800", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#FFF", fontWeight: "bold", fontSize: 14 }}>👩‍🏫</Text>
          </View>
          <View style={{ backgroundColor: "#F5F5F5", borderRadius: 16, borderBottomLeftRadius: 4, paddingHorizontal: 14, paddingVertical: 10, maxWidth: 160 }}>
            <View style={{ width: 120, height: 7, backgroundColor: "#E0E0E0", borderRadius: 4 }} />
            <View style={{ width: 80, height: 7, backgroundColor: "#E0E0E0", borderRadius: 4, marginTop: 4 }} />
            <Text style={{ fontSize: 9, color: "#BDBDBD", marginTop: 4 }}>10:30</Text>
          </View>
        </View>

        {/* Sent message */}
        <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#FF9800", borderRadius: 16, borderBottomRightRadius: 4, paddingHorizontal: 14, paddingVertical: 10, maxWidth: 160 }}>
            <View style={{ width: 100, height: 7, backgroundColor: "rgba(255,255,255,0.4)", borderRadius: 4 }} />
            <View style={{ width: 60, height: 7, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 4, marginTop: 4 }} />
            <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", marginTop: 4, textAlign: "right" }}>10:32</Text>
          </View>
        </View>

        {/* Received message */}
        <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-end" }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#FF9800", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#FFF", fontWeight: "bold", fontSize: 14 }}>👩‍🏫</Text>
          </View>
          <View style={{ backgroundColor: "#F5F5F5", borderRadius: 16, borderBottomLeftRadius: 4, paddingHorizontal: 14, paddingVertical: 10, maxWidth: 160 }}>
            <View style={{ width: 90, height: 7, backgroundColor: "#E0E0E0", borderRadius: 4 }} />
            <Text style={{ fontSize: 9, color: "#BDBDBD", marginTop: 4 }}>10:33</Text>
          </View>
        </View>

        {/* Input bar */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
          <View style={{ flex: 1, height: 36, backgroundColor: "#F5F5F5", borderRadius: 18, paddingHorizontal: 14, justifyContent: "center" }}>
            <View style={{ width: 70, height: 6, backgroundColor: "#E0E0E0", borderRadius: 3 }} />
          </View>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#FF9800", alignItems: "center", justifyContent: "center" }}>
            <Send size={16} color="#FFF" />
          </View>
        </View>
      </View>

      {/* Floating message icon */}
      <View style={{ position: "absolute", top: 20, left: 40, width: 48, height: 48, borderRadius: 14, backgroundColor: "#FFF", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, alignItems: "center", justifyContent: "center" }}>
        <MessageCircle size={22} color="#FF9800" />
      </View>
    </View>
  );
}

function ExtraHoursIllustration() {
  return (
    <View style={{ width: width * 0.85, height: height * 0.42, alignItems: "center", justifyContent: "center" }}>
      <View style={{ position: "absolute", top: 15, left: 40, width: 60, height: 60, borderRadius: 30, backgroundColor: "#FCE4EC", opacity: 0.6 }} />
      <View style={{ position: "absolute", bottom: 30, right: 35, width: 50, height: 50, borderRadius: 25, backgroundColor: "#FFF3E0", opacity: 0.6 }} />

      {/* Main card */}
      <View style={{
        width: 240, backgroundColor: "#FFFFFF", borderRadius: 20,
        shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 20,
        elevation: 8, padding: 20, alignItems: "center",
      }}>
        {/* Clock */}
        <View style={{
          width: 90, height: 90, borderRadius: 45, borderWidth: 4, borderColor: "#E91E63",
          alignItems: "center", justifyContent: "center", marginBottom: 16,
        }}>
          <Clock size={40} color="#E91E63" />
        </View>

        {/* Time options */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
          {["+15m", "+30m", "+1h"].map((label) => (
            <View
              key={label}
              style={{
                paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
                backgroundColor: label === "+30m" ? "#E91E63" : "#FCE4EC",
              }}
            >
              <Text style={{ color: label === "+30m" ? "#FFF" : "#E91E63", fontWeight: "bold", fontSize: 13 }}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Status badge */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FFF3E0", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#FF9800" }} />
          <View style={{ width: 70, height: 7, backgroundColor: "#FFE0B2", borderRadius: 4 }} />
        </View>

        {/* Absence section divider */}
        <View style={{ width: "100%", height: 1, backgroundColor: "#F0F0F0", marginVertical: 14 }} />

        {/* Calendar absence hint */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, width: "100%" }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#FCE4EC", alignItems: "center", justifyContent: "center" }}>
            <CalendarDays size={18} color="#E91E63" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ width: 80, height: 7, backgroundColor: "#F0F0F0", borderRadius: 4 }} />
            <View style={{ width: 100, height: 6, backgroundColor: "#F5F5F5", borderRadius: 3, marginTop: 4 }} />
          </View>
        </View>
      </View>

      {/* Floating bell */}
      <View style={{ position: "absolute", top: 30, right: 40, width: 46, height: 46, borderRadius: 14, backgroundColor: "#FFF", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, alignItems: "center", justifyContent: "center" }}>
        <Bell size={22} color="#E91E63" />
      </View>
    </View>
  );
}

function ProfileIllustration() {
  return (
    <View style={{ width: width * 0.85, height: height * 0.42, alignItems: "center", justifyContent: "center" }}>
      <View style={{ position: "absolute", top: 20, right: 25, width: 55, height: 55, borderRadius: 28, backgroundColor: "#ECEFF1", opacity: 0.6 }} />
      <View style={{ position: "absolute", bottom: 25, left: 35, width: 50, height: 50, borderRadius: 25, backgroundColor: "#E3F2FD", opacity: 0.6 }} />

      {/* Profile card */}
      <View style={{
        width: 240, backgroundColor: "#FFFFFF", borderRadius: 20,
        shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 20,
        elevation: 8, padding: 20, alignItems: "center",
      }}>
        {/* Avatar */}
        <View style={{
          width: 72, height: 72, borderRadius: 36, backgroundColor: "#ECEFF1",
          alignItems: "center", justifyContent: "center", marginBottom: 10,
          borderWidth: 3, borderColor: "#607D8B",
        }}>
          <User size={36} color="#607D8B" />
        </View>
        {/* Name placeholder */}
        <View style={{ width: 100, height: 10, backgroundColor: "#ECEFF1", borderRadius: 5, marginBottom: 6 }} />
        <View style={{ width: 60, height: 8, backgroundColor: "#F5F5F5", borderRadius: 4, marginBottom: 16 }} />

        {/* Info rows */}
        <View style={{ width: "100%", gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#ECEFF1", borderRadius: 10, padding: 10 }}>
            <Heart size={16} color="#E91E63" />
            <View style={{ flex: 1 }}>
              <View style={{ width: 60, height: 6, backgroundColor: "#CFD8DC", borderRadius: 3 }} />
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#E8F5E9", borderRadius: 10, padding: 10 }}>
            <Shield size={16} color="#4CAF50" />
            <View style={{ flex: 1 }}>
              <View style={{ width: 80, height: 6, backgroundColor: "#C8E6C9", borderRadius: 3 }} />
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#FFF3E0", borderRadius: 10, padding: 10 }}>
            <Phone size={16} color="#FF9800" />
            <View style={{ flex: 1 }}>
              <View style={{ width: 70, height: 6, backgroundColor: "#FFE0B2", borderRadius: 3 }} />
            </View>
          </View>
        </View>
      </View>

      {/* Floating element */}
      <View style={{ position: "absolute", top: 25, left: 35, width: 48, height: 48, borderRadius: 14, backgroundColor: "#FFF", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name="pencil" size={20} color="#607D8B" />
      </View>
    </View>
  );
}

// ─── Slide Config ────────────────────────────────────────────────────────────

type SlideData = {
  key: string;
  illustration: React.ReactNode;
  titleKey: string;
  descriptionKey: string;
  accentColor: string;
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Walkthrough() {
  const { language, setLanguage } = useLanguageStore();
  const tenant = useAppStore((state) => state.tenant);
  const colors = getColors(tenant?.primary_color, tenant?.secondary_color);
  const t = (key: string) => getTranslation(language, key);
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const slides: SlideData[] = [
    { key: "welcome", illustration: <WelcomeIllustration />, titleKey: "walkthrough.welcome_title", descriptionKey: "walkthrough.welcome_desc", accentColor: colors.primary },
    { key: "home", illustration: <DailyReportIllustration />, titleKey: "walkthrough.home_title", descriptionKey: "walkthrough.home_desc", accentColor: "#4CAF50" },
    { key: "activity", illustration: <ActivityIllustration />, titleKey: "walkthrough.activity_title", descriptionKey: "walkthrough.activity_desc", accentColor: "#2196F3" },
    { key: "media", illustration: <MediaIllustration />, titleKey: "walkthrough.media_title", descriptionKey: "walkthrough.media_desc", accentColor: "#9C27B0" },
    { key: "chat", illustration: <ChatIllustration />, titleKey: "walkthrough.chat_title", descriptionKey: "walkthrough.chat_desc", accentColor: "#FF9800" },
    { key: "extra", illustration: <ExtraHoursIllustration />, titleKey: "walkthrough.extra_title", descriptionKey: "walkthrough.extra_desc", accentColor: "#E91E63" },
    { key: "profile", illustration: <ProfileIllustration />, titleKey: "walkthrough.profile_title", descriptionKey: "walkthrough.profile_desc", accentColor: "#607D8B" },
  ];

  const isLastSlide = currentIndex === slides.length - 1;

  const handleComplete = async () => {
    await AsyncStorage.setItem(WALKTHROUGH_KEY, "true");
    router.replace("/(tabs)/home");
  };

  const handleNext = () => {
    if (isLastSlide) {
      handleComplete();
    } else {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({ index: currentIndex - 1, animated: true });
    }
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const currentAccent = slides[currentIndex]?.accentColor || colors.primary;

  const renderSlide = ({ item }: { item: SlideData }) => (
    <View
      style={{
        width,
        height,
        backgroundColor: "#FAFBFC",
        alignItems: "center",
        paddingTop: 80,
      }}
    >
      {/* Illustration */}
      {item.illustration}

      {/* Text content */}
      <View style={{ paddingHorizontal: 40, alignItems: "center", marginTop: 10 }}>
        <Text
          style={{
            fontSize: 26,
            fontWeight: "bold",
            color: "#1A1A2E",
            textAlign: "center",
            marginBottom: 12,
            writingDirection: language === "ar" ? "rtl" : "ltr",
          }}
        >
          {item.titleKey === "walkthrough.welcome_title"
            ? t(item.titleKey).replace("{name}", tenant?.name || "")
            : t(item.titleKey)}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: "#6B7280",
            textAlign: "center",
            lineHeight: 23,
            paddingHorizontal: 10,
            writingDirection: language === "ar" ? "rtl" : "ltr",
          }}
        >
          {t(item.descriptionKey)}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#FAFBFC" }}>
      <StatusBar barStyle="dark-content" />

      {/* Language button - top left (only on first slide) */}
      {currentIndex === 0 && (
        <TouchableOpacity
          onPress={() => setShowLanguageModal(true)}
          style={{
            position: "absolute",
            top: 54,
            left: 24,
            zIndex: 10,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#FFFFFF",
            paddingVertical: 8,
            paddingHorizontal: 14,
            borderRadius: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 3,
            gap: 6,
          }}
        >
          <Ionicons name="globe-outline" size={20} color={colors.primary} />
          <Text style={{ color: colors.textDark, fontSize: 14, fontWeight: "600" }}>
            {language === "en" ? "EN" : language === "fr" ? "FR" : "AR"}
          </Text>
        </TouchableOpacity>
      )}

      {/* Skip button - top right */}
      {!isLastSlide && (
        <TouchableOpacity
          onPress={handleSkip}
          style={{
            position: "absolute",
            top: 54,
            right: 24,
            zIndex: 10,
            paddingVertical: 8,
            paddingHorizontal: 16,
          }}
        >
          <Text style={{ color: "#9CA3AF", fontSize: 15, fontWeight: "500" }}>
            {t("walkthrough.skip")}
          </Text>
        </TouchableOpacity>
      )}

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        bounces={false}
      />

      {/* Bottom Controls */}
      <View
        style={{
          position: "absolute",
          bottom: 50,
          left: 0,
          right: 0,
          paddingHorizontal: 30,
        }}
      >
        {/* Pagination Dots */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 28,
          }}
        >
          {slides.map((slide, index) => (
            <View
              key={index}
              style={{
                width: currentIndex === index ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: currentIndex === index ? currentAccent : "#D1D5DB",
                marginHorizontal: 4,
              }}
            />
          ))}
        </View>

        {/* Buttons */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: currentIndex === 0 ? "center" : "space-between",
            alignItems: "center",
          }}
        >
          {/* Back */}
          {currentIndex > 0 && (
            <TouchableOpacity
              onPress={handleBack}
              activeOpacity={0.85}
              style={{
                borderWidth: 1.5,
                borderColor: currentAccent,
                paddingVertical: 14,
                paddingHorizontal: 28,
                borderRadius: 28,
                minWidth: 130,
                alignItems: "center",
              }}
            >
              <Text style={{ color: currentAccent, fontSize: 16, fontWeight: "bold" }}>
                {t("walkthrough.back")}
              </Text>
            </TouchableOpacity>
          )}

          {/* Next / Get Started */}
          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.85}
            style={{
              backgroundColor: currentAccent,
              paddingVertical: 14,
              paddingHorizontal: 36,
              borderRadius: 28,
              minWidth: currentIndex === 0 ? 200 : 130,
              alignItems: "center",
              shadowColor: currentAccent,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "bold" }}>
              {isLastSlide ? t("walkthrough.get_started") : t("walkthrough.next")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Language Modal */}
      <Modal visible={showLanguageModal} animationType="fade" transparent>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 24,
            backgroundColor: colors.overlayDark,
          }}
        >
          <View
            style={{
              width: "100%",
              borderRadius: 16,
              padding: 24,
              backgroundColor: colors.cardBackground,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                marginBottom: 24,
                textAlign: "center",
                color: colors.textDark,
              }}
            >
              {t("common.language")}
            </Text>

            {["en", "fr", "ar"].map((lang) => (
              <TouchableOpacity
                key={lang}
                onPress={() => setLanguage(lang as "en" | "fr" | "ar")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
                  marginBottom: 8,
                  borderRadius: 12,
                  backgroundColor: language === lang ? colors.maleBlue : colors.background,
                }}
              >
                <Ionicons
                  name="globe-outline"
                  size={20}
                  color={language === lang ? colors.cardBackground : colors.textDark}
                />
                <Text
                  style={{
                    marginLeft: 12,
                    fontWeight: "600",
                    fontSize: 16,
                    color: language === lang ? colors.cardBackground : colors.textDark,
                  }}
                >
                  {lang === "en" ? "English" : lang === "fr" ? "Français" : "العربية"}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              onPress={() => setShowLanguageModal(false)}
              style={{
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 20,
                marginTop: 16,
                backgroundColor: colors.accent,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 16 }}>
                {t("common.save")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
