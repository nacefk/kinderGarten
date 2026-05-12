import { router } from "expo-router";
import { Check, ChevronLeft, Pencil, ChevronDown, LogOut } from "lucide-react-native";
import { useEffect, useState, useCallback } from "react";
import {
  Alert,
  Linking,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { getColors } from "@/config/colors";
import Card from "../../components/Card";
import HeaderBar from "@/components/Header";
import Row from "../../components/Row";
import * as ImagePicker from "expo-image-picker";
import { getMyChild, updateChild, uploadAvatar } from "@/api/children";
import { useAuthStore } from "@/store/useAuthStore";
import { useLanguageStore } from "@/store/useLanguageStore";
import { getTranslation } from "@/config/translations";
import { useAppStore } from "@/store/useAppStore";

export default function Profile() {
  const { language } = useLanguageStore();
  const tenant = useAppStore((state) => state.tenant);
  const colors = getColors(tenant?.primary_color, tenant?.secondary_color);
  const t = (key: string) => getTranslation(language, key);
  const [isEditing, setIsEditing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { logout } = useAuthStore();

  /** ✅ Logout handler */
  const handleLogout = useCallback(async () => {
    Alert.alert(t("profile.logout"), t("profile.confirm_logout"), [
      {
        text: t("common.cancel"),
        onPress: () => {},
        style: "cancel",
      },
      {
        text: t("profile.logout_action"),
        onPress: async () => {
          try {
            await logout();
            router.replace("/");
          } catch (err: any) {
            Alert.alert(t("common.error"), t("profile.error_logout"));
            console.error("Logout error:", err);
          }
        },
        style: "destructive",
      },
    ]);
  }, [logout]);

  /** 🧮 Calcul de l’âge */
  const getAge = (birthdate?: string) => {
    if (!birthdate) return "";
    const parsed = new Date(birthdate);
    if (isNaN(parsed.getTime())) return "";
    const today = new Date();
    let years = today.getFullYear() - parsed.getFullYear();
    let months = today.getMonth() - parsed.getMonth();
    if (months < 0) {
      years--;
      months += 12;
    }
    if (years < 1) return t("profile.age_months").replace("{count}", String(months));
    if (months > 0)
      return t("profile.age_years_months")
        .replace("{years}", String(years))
        .replace("{months}", String(months));
    return t("profile.age_years").replace("{years}", String(years));
  };

  /** 📦 Charger le profil depuis l’API */
  const loadProfile = async () => {
    try {
      const data = await getMyChild();
      console.log("👤 [Profile] API gender value:", JSON.stringify(data?.gender));
      console.log("👤 [Profile] All keys:", Object.keys(data || {}));
      console.log("👤 [Profile] Full data:", JSON.stringify(data, null, 2));
      const fullProfile = {
        id: data?.id,
        name: data?.name,
        avatar: data?.avatar,
        group: data?.classroom_name,
        birthdate: data?.birthdate,
        age: getAge(data?.birthdate),
        weight: data?.weight,
        height: data?.height,
        gender: data?.gender,
        allergies: data?.allergies,
        conditions: data?.conditions,
        medication: data?.medication,
        doctor: data?.doctor,
        emergencyContact: {
          name: data?.emergency_contact_name,
          relation: data?.emergency_contact_relation,
          phone: data?.emergency_contact_phone,
        },
        authorizedPickups: data?.authorized_pickups,
        hasMobileApp: data?.has_mobile_app === true,
        parent_username: data?.parent_user?.username,
        parent_password: data?.parent_user?.password,
        parent_name: data?.parent_user?.first_name || data?.parent_name,
        parent_email: data?.parent_user?.email,
        classInfo: {
          teacherName: data?.teacher_name,
          classroomName: data?.classroom_name,
          responsibleName: data?.responsible_name,
          responsiblePhone: data?.responsible_phone,
        },
        parent_credentials: data?.parent_credentials,
      };

      // console.log("✅ Full Profile State:", JSON.stringify(fullProfile, null, 2));
      // console.log("🔐 Parent Credentials in fullProfile:", fullProfile.parent_credentials);
      setProfile(fullProfile);
    } catch (error: any) {
      console.error("❌ Erreur de chargement:", error.response?.data || error.message);
      Alert.alert(t("common.error"), t("profile.error_load"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadProfile();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };
  const updateField = (key: string, value: any) => {
    setProfile((prev: any) => ({ ...prev, [key]: value }));
  };

  /** ☁️ Changer l’avatar */
  const handleChangeAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.length > 0) {
        const uri = result.assets[0].uri;
        setLoading(true);
        const uploadedUrl = await uploadAvatar(uri);
        await updateChild(profile.id, { avatar: uploadedUrl });
        updateField("avatar", uploadedUrl);
        Alert.alert(t("profile.avatar_success_title"), t("profile.avatar_success_msg"));
      }
    } catch (error) {
      console.error("❌ Erreur de téléchargement:", error);
      Alert.alert(t("common.error"), t("profile.error_avatar"));
    } finally {
      setLoading(false);
    }
  };

  /** 💾 Sauvegarder les modifications */
  const saveProfile = async () => {
    try {
      setLoading(true);
      const payload = {
        name: profile.name,
        birthdate: profile.birthdate,
        gender: profile.gender,
        allergies: profile.allergies,
        conditions: profile.conditions,
        medication: profile.medication,
        doctor: profile.doctor,
        weight: profile.weight,
        height: profile.height,
        emergency_contact_name: profile.emergencyContact?.name,
        emergency_contact_relation: profile.emergencyContact?.relation,
        emergency_contact_phone: profile.emergencyContact?.phone,
        authorized_pickups: profile.authorizedPickups || [],
      };
      await updateChild(profile.id, payload);
      Alert.alert(t("profile.save_success_title"), t("profile.save_success_msg"));
      setIsEditing(false);
    } catch (error: any) {
      console.error("❌ Erreur de sauvegarde:", error.response?.data || error.message);
      Alert.alert(t("common.error"), t("profile.error_save"));
    } finally {
      setLoading(false);
    }
  };

  /** 📞 Appel téléphonique */
  const handlePhoneCall = useCallback((phone: string) => {
    if (!phone) return;
    const sanitized = phone.replace(/[^+\d]/g, "");
    const url = `tel:${sanitized}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) Linking.openURL(url);
        else Alert.alert(t("common.error"), t("profile.error_phone"));
      })
      .catch(() => Alert.alert(t("common.error"), t("profile.error_phone_call")));
  }, []);

  /** 🧱 Ligne réutilisable */
  const renderRow = (
    label: string,
    key: string,
    value: string,
    editable: boolean,
    onChange: (v: string) => void,
    onPressPhone?: (v: string) => void,
    options?: { numeric?: boolean; suffix?: string }
  ) => {
    const isPhoneField = label.toLowerCase().includes("téléphone");
    const isNumeric = options?.numeric || false;
    const suffix = options?.suffix || "";
    return (
      <View className="flex-row justify-between items-start mb-3" style={{ flexWrap: "wrap" }}>
        <View style={{ flexShrink: 1, flexBasis: "40%" }}>
          <Text numberOfLines={2} ellipsizeMode="tail" style={{ color: colors.text }}>
            {label}
          </Text>
        </View>

        <View style={{ flexShrink: 1, flexBasis: "58%", alignItems: "flex-end" }}>
          {editable ? (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TextInput
                value={value}
                onChangeText={onChange}
                keyboardType={isPhoneField ? "phone-pad" : isNumeric ? "numeric" : "default"}
                className="border-b border-gray-300 text-right"
                style={{ color: colors.textDark, minWidth: 100 }}
              />
              {suffix ? (
                <Text style={{ color: colors.textLight, marginLeft: 4 }}>{suffix}</Text>
              ) : null}
            </View>
          ) : isPhoneField && value ? (
            <TouchableOpacity onPress={() => onPressPhone && onPressPhone(value)}>
              <Text
                style={{
                  color: colors.accent,
                  textAlign: "right",
                  textDecorationLine: "underline",
                }}
              >
                {value}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text
              style={{
                color: value ? colors.textDark : colors.textLight,
                textAlign: "right",
                flexWrap: "wrap",
              }}
            >
              {value ? `${value}${suffix ? ` ${suffix}` : ""}` : "—"}
            </Text>
          )}
        </View>
      </View>
    );
  };

  if (loading || !profile) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ color: colors.textLight, marginTop: 8 }}>{t("profile.loading")}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar barStyle={"dark-content"} />

      {/* En-tête */}
      <HeaderBar
        title={t("profile.my_profile")}
        showBack={true}
        rightElement={
          <TouchableOpacity
            onPress={() => {
              if (isEditing) saveProfile();
              else setIsEditing(true);
            }}
          >
            {isEditing ? <Check color="#fff" size={26} /> : <Pencil color="#fff" size={24} />}
          </TouchableOpacity>
        }
      />

      {/* 🧱 Scroll content */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* 👶 Informations sur l’enfant */}
          <Card title={t("profile.child_info")}>
            <View className="items-center">
              <TouchableOpacity
                disabled={!isEditing}
                onPress={isEditing ? handleChangeAvatar : undefined}
              >
                <Image source={{ uri: profile?.avatar }} className="w-28 h-28 rounded-full mb-3" />
              </TouchableOpacity>
              {isEditing ? (
                <>
                  <TextInput
                    value={profile?.name}
                    onChangeText={(t) => updateField("name", t)}
                    className="text-center text-xl font-semibold border-b border-gray-300 w-48 mb-1"
                    style={{ color: colors.textDark }}
                  />
                  <TextInput
                    value={profile?.group}
                    editable={false}
                    className="text-center border-b border-gray-300 w-48"
                    style={{ color: colors.text }}
                  />
                </>
              ) : (
                <>
                  <Text className="text-xl font-semibold" style={{ color: colors.textDark }}>
                    {profile?.name}
                  </Text>
                  <Text style={{ color: colors.text, marginTop: 4 }}>
                    {getAge(profile?.birthdate)} • {profile?.group}
                  </Text>
                </>
              )}
            </View>
          </Card>

          {/* 📏 Informations physiques */}
          <Card title={t("profile.physical_info")}>
            <Row label={t("profile.birthdate")} colors={colors}>
              {isEditing ? (
                <>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    className="border-b border-gray-300 w-40"
                  >
                    <Text
                      className="text-right font-medium py-1"
                      style={{ color: colors.textDark }}
                    >
                      {profile?.birthdate || t("profile.select_date")}
                    </Text>
                  </TouchableOpacity>

                  {showDatePicker && (
                    <DateTimePicker
                      value={new Date(profile?.birthdate || "2020-01-01")}
                      mode="date"
                      display="default"
                      maximumDate={new Date()}
                      onChange={(event, selectedDate) => {
                        setShowDatePicker(false);
                        if (selectedDate) {
                          const formatted = selectedDate.toISOString().split("T")[0];
                          updateField("birthdate", formatted);
                          updateField("age", getAge(formatted));
                        }
                      }}
                    />
                  )}
                </>
              ) : (
                <Text className="font-medium text-right" style={{ color: colors.textDark }}>
                  {profile?.birthdate}
                </Text>
              )}
            </Row>

            {renderRow(
              t("profile.weight"),
              "weight",
              profile?.weight,
              isEditing,
              (v) => updateField("weight", v),
              undefined,
              { numeric: true, suffix: "kg" }
            )}
            {renderRow(
              t("profile.height"),
              "height",
              profile?.height,
              isEditing,
              (v) => updateField("height", v),
              undefined,
              { numeric: true, suffix: "cm" }
            )}

            <Row label={t("profile.gender")} colors={colors}>
              {isEditing ? (
                <TouchableOpacity
                  onPress={() => setShowGenderDropdown(!showGenderDropdown)}
                  className="flex-row justify-between items-center border-b border-gray-300 w-40"
                >
                  <Text className="text-right font-medium py-1" style={{ color: colors.textDark }}>
                    {profile?.gender === "male"
                      ? t("profile.male")
                      : profile?.gender === "female"
                        ? t("profile.female")
                        : profile?.gender || t("profile.select_gender")}
                  </Text>
                  <ChevronDown color={colors.textDark} size={18} />
                </TouchableOpacity>
              ) : (
                <Text className="font-medium text-right" style={{ color: colors.textDark }}>
                  {profile?.gender === "male"
                    ? t("profile.male")
                    : profile?.gender === "female"
                      ? t("profile.female")
                      : profile?.gender || "-"}
                </Text>
              )}
            </Row>

            {showGenderDropdown && isEditing && (
              <View
                className="rounded-xl shadow-sm p-3 mt-1"
                style={{ backgroundColor: colors.cardBackground }}
              >
                {["female", "male"].map((value) => {
                  const label = value === "female" ? t("profile.female") : t("profile.male");
                  return (
                    <TouchableOpacity
                      key={value}
                      onPress={() => {
                        updateField("gender", value);
                        setShowGenderDropdown(false);
                      }}
                      className={`py-2 rounded-xl ${profile?.gender === value ? "bg-gray-100" : ""}`}
                    >
                      <Text
                        className="text-right"
                        style={{
                          color: profile?.gender === value ? colors.accent : colors.textDark,
                          fontWeight: profile?.gender === value ? "600" : "400",
                        }}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </Card>

          {/* 🚑 Santé & Allergies */}
          <Card title={t("profile.health_allergies")}>
            {renderRow(t("profile.allergies"), "allergies", profile?.allergies, isEditing, (v) =>
              updateField("allergies", v)
            )}
            {renderRow(t("profile.conditions"), "conditions", profile?.conditions, isEditing, (v) =>
              updateField("conditions", v)
            )}
            {renderRow(t("profile.medication"), "medication", profile?.medication, isEditing, (v) =>
              updateField("medication", v)
            )}
            {renderRow(t("profile.doctor"), "doctor", profile?.doctor, isEditing, (v) =>
              updateField("doctor", v)
            )}
          </Card>

          {/* 🚗 Personnes autorisées */}
          <Card title={t("profile.authorized_pickups")}>
            {profile?.authorizedPickups?.length > 0 ? (
              profile.authorizedPickups.map((person: any, index: number) => (
                <View key={index} className="mb-3">
                  {renderRow(
                    `👤 ${t("profile.username")} ${index + 1}`,
                    "",
                    person.name,
                    isEditing,
                    (v) => {
                      const updated = [...profile.authorizedPickups];
                      updated[index] = { ...updated[index], name: v };
                      updateField("authorizedPickups", updated);
                    }
                  )}
                  {renderRow(
                    `📞 ${t("profile.password")} ${index + 1}`,
                    "",
                    person.phone,
                    isEditing,
                    (v) => {
                      const updated = [...profile.authorizedPickups];
                      updated[index] = { ...updated[index], phone: v };
                      updateField("authorizedPickups", updated);
                    },
                    handlePhoneCall
                  )}
                  {renderRow(
                    `👥 ${t("profile.tenant")} ${index + 1}`,
                    "",
                    person.relation,
                    isEditing,
                    (v) => {
                      const updated = [...profile.authorizedPickups];
                      updated[index] = { ...updated[index], relation: v };
                      updateField("authorizedPickups", updated);
                    }
                  )}
                </View>
              ))
            ) : (
              <Text style={{ color: colors.text }}>{t("profile.no_authorized_pickups")}</Text>
            )}

            {isEditing && (
              <TouchableOpacity
                onPress={() => {
                  const updated = [
                    ...(profile.authorizedPickups || []),
                    { name: "", phone: "", relation: "" },
                  ];
                  updateField("authorizedPickups", updated);
                }}
                className="mt-3 self-end"
              >
                <Text style={{ color: colors.accent, fontWeight: "600" }}>
                  {t("profile.add_new")}
                </Text>
              </TouchableOpacity>
            )}
          </Card>

          {/* 🚨 Contact d’urgence */}
          <Card title={t("profile.emergency_contact")}>
            {renderRow(
              t("profile.name_label"),
              "",
              profile?.emergencyContact?.name,
              isEditing,
              (v) => updateField("emergencyContact", { ...profile?.emergencyContact, name: v })
            )}
            {renderRow(
              t("profile.relation_label"),
              "",
              profile?.emergencyContact?.relation,
              isEditing,
              (v) => updateField("emergencyContact", { ...profile?.emergencyContact, relation: v })
            )}
            {renderRow(
              t("profile.phone_label"),
              "",
              profile?.emergencyContact?.phone,
              isEditing,
              (v) => updateField("emergencyContact", { ...profile?.emergencyContact, phone: v }),
              handlePhoneCall
            )}
          </Card>

          {/* 🎓 Informations sur la classe */}
          <Card title={t("profile.class_info")}>
            {renderRow(t("profile.teacher"), "", profile?.classInfo?.teacherName, isEditing, (v) =>
              updateField("classInfo", { ...profile?.classInfo, teacherName: v })
            )}
            {renderRow(
              t("profile.classroom_room"),
              "",
              profile?.classInfo?.classroomName,
              isEditing,
              (v) => updateField("classInfo", { ...profile?.classInfo, classroomName: v })
            )}
            {renderRow(
              t("profile.responsible"),
              "",
              profile?.classInfo?.responsibleName,
              isEditing,
              (v) => updateField("classInfo", { ...profile?.classInfo, responsibleName: v })
            )}
            {renderRow(
              t("profile.phone_label"),
              "",
              profile?.classInfo?.responsiblePhone,
              isEditing,
              (v) => updateField("classInfo", { ...profile?.classInfo, responsiblePhone: v }),
              handlePhoneCall
            )}
          </Card>

          {/* Replay Walkthrough */}
          <TouchableOpacity
            onPress={async () => {
              const AsyncStorage = (await import("@react-native-async-storage/async-storage"))
                .default;
              await AsyncStorage.removeItem("kindergarten_walkthrough_seen");
              router.push("/walkthrough");
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              paddingVertical: 14,
              marginTop: 8,
              marginBottom: 24,
              backgroundColor: colors.cardBackground,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 18 }}>📖</Text>
            <Text style={{ color: colors.primary, fontSize: 15, fontWeight: "600" }}>
              {t("walkthrough.replay")}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
