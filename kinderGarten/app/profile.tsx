import { router, useLocalSearchParams } from "expo-router";
import { Check, ChevronLeft, Pencil, ChevronDown } from "lucide-react-native";
import { useEffect, useState } from "react";
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
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import colors from "../config/colors";
import Card from "../components/Card";
import Row from "../components/Row";
import { getChildById, getClassrooms, getClubs, updateChild } from "@/api/children";
import * as ImagePicker from "expo-image-picker";
import { uploadAvatar } from "@/api/children";

export default function Profile() {
  const { id } = useLocalSearchParams();
  const childId = Array.isArray(id) ? id[0] : id;

  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [classData, clubData] = await Promise.all([getClassrooms(), getClubs()]);
        setClassrooms(classData);
        setClubs(clubData);
      } catch (error) {
        console.error("❌ Error fetching class/clubs:", error);
      }
    })();
  }, []);

  /** 🖼️ Pick or take photo */
  const handleChangeAvatar = async () => {
    try {
      const result = await Alert.alert("Photo de profil", "Choisissez une option :", [
        { text: "📷 Prendre une photo", onPress: async () => await pickImage(true) },
        { text: "🖼️ Choisir depuis la galerie", onPress: async () => await pickImage(false) },
        { text: "Annuler", style: "cancel" },
      ]);
    } catch (error) {
      console.error("❌ Error changing avatar:", error);
    }
  };

  /** 📸 Internal picker */
  const pickImage = async (useCamera = false) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission refusée", "Veuillez autoriser l’accès à la caméra.");
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: "images",
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: "images",
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

    if (!result.canceled && result.assets?.length > 0) {
      const uri = result.assets[0].uri;
      await handleUploadAvatar(uri);
    }
  };

  /** ☁️ Upload and update profile */
  const handleUploadAvatar = async (uri: string) => {
    try {
      setLoading(true);
      const uploadedUrl = await uploadAvatar(uri); // your API returns { url }
      updateField("avatar", uploadedUrl);
      await updateChild(childId, { avatar: uploadedUrl });
      Alert.alert("✅ Succès", "Photo de profil mise à jour !");
    } catch (e: any) {
      console.error("❌ Error uploading avatar:", e.response?.data || e.message);
      Alert.alert("Erreur", "Impossible de mettre à jour la photo de profil.");
    } finally {
      setLoading(false);
    }
  };

  /** 💾 Save profile */
  const saveProfile = async () => {
    if (!childId || !profile) return;
    try {
      setLoading(true);

      const payload = {
        name: profile.name,
        birthdate: profile.birthdate,
        gender: profile.gender,
        classroom: profile.classroom_id,
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
        responsible_name: profile.classInfo?.responsibleName,
        responsible_phone: profile.classInfo?.responsiblePhone,
        teacher_name: profile.classInfo?.teacherName,
        clubs: profile.clubs || [],
        has_mobile_app: profile.hasMobileApp === true,
      };
      console.log("payload:", payload);
      await updateChild(childId, payload);

      // Re-fetch updated data from the backend
      const refreshed = await getChildById(childId);

      const { has_mobile_app, ...restRefreshed } = refreshed;

      setProfile({
        ...restRefreshed,
        hasMobileApp: has_mobile_app === true,
        className: refreshed.classroom_name || "",
        club_details: refreshed.club_details || [],
        clubs: refreshed.clubs || [],
        emergencyContact: {
          name: refreshed.emergency_contact_name,
          relation: refreshed.emergency_contact_relation,
          phone: refreshed.emergency_contact_phone,
        },
        classInfo: {
          teacherName: refreshed.classroom_teacher_name || "",
          classroomName: refreshed.classroom_name || "",
          responsibleName: refreshed.classroom_assistant_name || "",
          responsiblePhone: refreshed.classroom_phone || "",
        },
      });

      setIsEditing(false);
      Alert.alert("✅ Succès", "Profil mis à jour sur le serveur.");
    } catch (error: any) {
      console.error("❌ Error updating child:", error.response?.data || error.message);
      Alert.alert("Erreur", "Impossible de mettre à jour le profil sur le serveur.");
    } finally {
      setLoading(false);
    }
  };

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
    if (years < 1) return `${months} mois`;
    return `${years} an${years > 1 ? "s" : ""}${months > 0 ? ` ${months} mois` : ""}`;
  };
  useEffect(() => {
    (async () => {
      try {
        const data = await getClassrooms();
        setClassrooms(data);
      } catch (error) {
        console.error("❌ Error fetching classrooms:", error);
      }
    })();
  }, []);
  useEffect(() => {
    if (profile && clubs.length > 0 && !profile.availableClubs) {
      setProfile((p: any) => ({ ...p, availableClubs: clubs }));
    }
  }, [clubs, profile]);

  /** 📦 Chargement du profil depuis le backend */
  useEffect(() => {
    if (!childId) return;
    (async () => {
      setLoading(true);
      try {
        const data = await getChildById(childId);
        const filled = {
          id: data?.id || "",
          name: data?.name || "",
          avatar: data?.avatar || "https://cdn-icons-png.flaticon.com/512/1946/1946429.png",
          hasMobileApp: data?.has_mobile_app === true,
          username: data?.username || "",
          password: data?.password || "",
          birthdate: data?.birthdate || "",
          gender: data?.gender || "",
          className: data?.classroom_name || "",
          parent_name: data?.parent_user?.first_name || data?.parent_name || "",
          allergies: data?.allergies || "",
          conditions: data?.conditions || "",
          medication: data?.medication || "",
          doctor: data?.doctor || "",
          weight: data?.weight || "",
          height: data?.height || "",
          nextPaymentDate: data?.next_payment_date || "", // 🧠 use correct field name
          clubs: data?.clubs || [],
          club_details: data?.club_details || [],
          emergencyContact: {
            name: data?.emergency_contact_name || "",
            relation: data?.emergency_contact_relation || "",
            phone: data?.emergency_contact_phone || "",
          },
          authorizedPickups: data?.authorized_pickups || [],
          classInfo: {
            teacherName: data?.teacher_name || "",
            classroomName: data?.classroom_name || "",
            responsibleName: data?.responsible_name || "",
            responsiblePhone: data?.responsible_phone || "",
          },
          parent_username: data?.parent_user?.username,
          parent_email: data?.parent_user?.email,
        };
        setProfile(filled);
      } catch (e: any) {
        console.error("❌ Error fetching child:", e.response?.data || e.message);
        Alert.alert("Erreur", "Impossible de charger les informations de l'enfant.");
      } finally {
        setLoading(false);
      }
    })();
  }, [childId]);

  const updateField = (key: string, value: any) => {
    setProfile((prev: any) => ({ ...prev, [key]: value }));
  };

  const handlePhoneCall = (phone: string) => {
    if (!phone) return;
    const sanitized = phone.replace(/[^+\d]/g, "");
    const url = `tel:${sanitized}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) Linking.openURL(url);
        else Alert.alert("Erreur", "Impossible d’ouvrir le composeur téléphonique.");
      })
      .catch(() => Alert.alert("Erreur", "Une erreur est survenue lors de l’appel."));
  };

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ color: colors.textLight, marginTop: 8 }}>Chargement du profil...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <Text style={{ color: colors.textLight }}>Aucune donnée trouvée.</Text>
      </View>
    );
  }

  /** 📆 Statut du paiement */
  const getPaymentStatus = (dateString: string) => {
    if (!dateString || dateString === "Non définie")
      return { label: "Non défini", color: colors.textLight };

    const today = new Date();
    const dueDate = new Date(dateString);
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: "En retard", color: "#DC2626" };
    } else if (diffDays <= 3) {
      return { label: "Paiement proche", color: "#F59E0B" };
    } else {
      return { label: "Régulier", color: "#16A34A" };
    }
  };

  const paymentStatus = getPaymentStatus(profile.nextPaymentDate);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar barStyle={"dark-content"} />

      {/* Header */}
      <View
        className="flex-row items-center justify-between px-5 pt-16 pb-6"
        style={{ backgroundColor: colors.accentLight }}
      >
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <ChevronLeft color={colors.textDark} size={28} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => (isEditing ? saveProfile() : setIsEditing(true))}>
          {isEditing ? (
            <Check color={colors.textDark} size={26} />
          ) : (
            <Pencil color={colors.textDark} size={24} />
          )}
        </TouchableOpacity>
      </View>

      {/* Scroll */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* 👶 Child info */}
          <Card title="Informations de l’enfant">
            <View className="items-center">
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={!isEditing}
                onPress={isEditing ? handleChangeAvatar : undefined}
              >
                <View>
                  <Image
                    source={{ uri: profile.avatar }}
                    className="w-28 h-28 rounded-full mb-3"
                    style={{
                      borderWidth: isEditing ? 2 : 0,
                      borderColor: colors.accent,
                    }}
                  />
                  {isEditing && (
                    <View
                      style={{
                        position: "absolute",
                        bottom: 4,
                        right: 4,
                        backgroundColor: colors.accent,
                        borderRadius: 16,
                        padding: 5,
                      }}
                    >
                      <Pencil size={14} color="#FFF" />
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              {isEditing ? (
                <TextInput
                  value={profile.name}
                  onChangeText={(t) => updateField("name", t)}
                  className="text-center text-xl font-semibold border-b border-gray-300 w-48 mb-1"
                  style={{ color: colors.textDark }}
                />
              ) : (
                <>
                  <Text className="text-xl font-semibold" style={{ color: colors.textDark }}>
                    {profile.name}
                  </Text>
                </>
              )}
            </View>
          </Card>

          {/* 🧩 Class & Clubs */}
          <Card title="Activités & Groupe">
            {/* 🏫 Class */}
            <View className="mb-5">
              {isEditing ? (
                <View style={{ width: "100%" }}>
                  <Text style={{ color: colors.text, marginBottom: 4 }}>🏫 Classe</Text>
                  <TouchableOpacity
                    onPress={() => setShowClassDropdown(!showClassDropdown)}
                    className="flex-row justify-between items-center border-b border-gray-300 py-1"
                  >
                    <Text style={{ color: profile.className ? colors.textDark : colors.textLight }}>
                      {profile.className || "Sélectionner une classe"}
                    </Text>
                    <ChevronDown color={colors.textDark} size={18} />
                  </TouchableOpacity>
                  {showClassDropdown && (
                    <View
                      className="rounded-xl shadow-sm p-3 mt-1"
                      style={{ backgroundColor: colors.cardBackground }}
                    >
                      {classrooms.map((c) => (
                        <TouchableOpacity
                          key={c.id}
                          onPress={() => {
                            updateField("className", c.name);
                            updateField("classroom_id", c.id);
                            setShowClassDropdown(false);
                          }}
                          className={`py-2 rounded-xl ${profile.className === c.name ? "bg-gray-100" : ""}`}
                        >
                          <Text
                            style={{
                              color: profile.className === c.name ? colors.accent : colors.textDark,
                            }}
                          >
                            {c.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              ) : (
                <View className="flex-row justify-between items-center">
                  <Text style={{ color: colors.text }}>🏫 Classe</Text>
                  <Text style={{ color: colors.textDark }}>{profile.className || "—"}</Text>
                </View>
              )}
            </View>
            {/* 📱 Mobile App Access */}
            <View
              className="flex-row justify-between items-center mb-5 px-4 py-2.5 rounded-xl"
              style={{
                backgroundColor: "#F8F8F8",
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            >
              <Text style={{ color: colors.textDark, fontWeight: "500", fontSize: 14.5 }}>
                Accès à l’application mobile
              </Text>

              {isEditing ? (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={async () => {
                    const newValue = !profile.hasMobileApp;
                    updateField("hasMobileApp", newValue);

                    if (!profile.hasMobileApp && newValue) {
                      try {
                        const res = await fetch(
                          `http://YOUR_API_URL/api/children/${childId}/generate_credentials/`,
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                          }
                        );
                        const data = await res.json();

                        if (res.ok) {
                          Alert.alert(
                            "✅ Accès activé",
                            `Identifiants générés :\n👤 ${data.username}\n🔑 ${data.password}`
                          );
                        } else {
                          Alert.alert(
                            "Erreur",
                            data.detail || "Impossible de générer les identifiants."
                          );
                        }
                      } catch (err: any) {
                        console.error("❌ Error generating credentials:", err.message);
                        Alert.alert("Erreur", "Impossible de générer les identifiants.");
                      }
                    }
                  }}
                  style={{
                    width: 46,
                    height: 26,
                    borderRadius: 13,
                    backgroundColor: profile.hasMobileApp ? colors.accent : "#D1D5DB",
                    justifyContent: "center",
                    paddingHorizontal: 3,
                  }}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: "#FFF",
                      transform: [{ translateX: profile.hasMobileApp ? 20 : 0 }],
                      shadowColor: "#000",
                      shadowOpacity: 0.15,
                      shadowRadius: 2,
                      elevation: 3,
                    }}
                  />
                </TouchableOpacity>
              ) : (
                <Text
                  style={{
                    color: profile.hasMobileApp ? colors.accent : colors.textLight,
                    fontWeight: "500",
                  }}
                >
                  {profile.hasMobileApp ? "Oui" : "Non"}
                </Text>
              )}
            </View>

            {/* 🔐 Mobile App Credentials */}
            {profile.hasMobileApp && (profile.username || profile.password) && (
              <View
                className="p-4 rounded-xl mb-5"
                style={{
                  backgroundColor: "#F0F9FF",
                  borderWidth: 1,
                  borderColor: colors.accent,
                }}
              >
                <Text style={{ color: colors.accent, fontWeight: "600", marginBottom: 8 }}>
                  🔐 Identifiants de connexion
                </Text>
                {profile.username && (
                  <View className="mb-3">
                    <Text style={{ color: colors.textLight, fontSize: 12 }}>Nom d'utilisateur</Text>
                    <View
                      className="flex-row items-center justify-between px-3 py-2 rounded-lg mt-1"
                      style={{ backgroundColor: "#FFF", borderWidth: 1, borderColor: "#E5E7EB" }}
                    >
                      <Text style={{ color: colors.textDark, fontWeight: "500" }}>
                        {profile.username}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          // Copy to clipboard
                          alert("Copié: " + profile.username);
                        }}
                      >
                        <Text style={{ color: colors.accent, fontSize: 12 }}>📋 Copier</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                {profile.password && (
                  <View>
                    <Text style={{ color: colors.textLight, fontSize: 12 }}>Mot de passe</Text>
                    <View
                      className="flex-row items-center justify-between px-3 py-2 rounded-lg mt-1"
                      style={{ backgroundColor: "#FFF", borderWidth: 1, borderColor: "#E5E7EB" }}
                    >
                      <Text style={{ color: colors.textDark, fontWeight: "500" }}>
                        {profile.password}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          // Copy to clipboard
                          alert("Copié: " + profile.password);
                        }}
                      >
                        <Text style={{ color: colors.accent, fontSize: 12 }}>📋 Copier</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* 🎵 Clubs */}
            <View>
              <Text style={{ color: colors.text, marginBottom: 4 }}>🎵 Clubs</Text>

              {isEditing ? (
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 8,
                    marginTop: 6,
                  }}
                >
                  {clubs.length > 0 ? (
                    clubs.map((club) => {
                      const isSelected = profile.clubs?.includes(club.id);
                      return (
                        <TouchableOpacity
                          key={club.id}
                          onPress={() => {
                            const newClubs = isSelected
                              ? profile.clubs.filter((id: number) => id !== club.id)
                              : [...(profile.clubs || []), club.id];
                            updateField("clubs", newClubs);
                          }}
                          style={{
                            backgroundColor: isSelected ? colors.accent : colors.cardBackground,
                            borderWidth: 1,
                            borderColor: colors.accent,
                            borderRadius: 12,
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                          }}
                        >
                          <Text
                            style={{
                              color: isSelected ? "#fff" : colors.textDark,
                              fontWeight: "500",
                            }}
                          >
                            {club.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    <Text style={{ color: colors.textLight }}>Aucun club disponible</Text>
                  )}
                </View>
              ) : (
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 8,
                    marginTop: 6,
                  }}
                >
                  {profile.club_details?.length ? (
                    profile.club_details.map((club: any) => (
                      <View
                        key={club.id}
                        style={{
                          backgroundColor: colors.cardBackground,
                          borderRadius: 10,
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderWidth: 1,
                          borderColor: colors.accent,
                        }}
                      >
                        <Text style={{ color: colors.textDark, fontWeight: "500" }}>
                          {club.name}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={{ color: colors.textLight }}>Aucun club assigné</Text>
                  )}
                </View>
              )}
            </View>
          </Card>

          {/* 📏 Informations physiques */}
          <Card title="Informations physiques">
            {/* 🎂 Date de naissance */}
            <View className="mb-4">
              {isEditing ? (
                <View style={{ width: "100%" }}>
                  <Text style={{ color: colors.text, marginBottom: 4 }}>🎂 Date de naissance</Text>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    className="border-b border-gray-300 py-1"
                  >
                    <Text
                      style={{
                        color: profile?.birthdate ? colors.textDark : colors.textLight,
                      }}
                    >
                      {profile?.birthdate || "Sélectionner une date"}
                    </Text>
                  </TouchableOpacity>

                  {showDatePicker && (
                    <DateTimePicker
                      value={profile?.birthdate ? new Date(profile.birthdate) : new Date()}
                      mode="date"
                      display="default"
                      maximumDate={new Date()}
                      onChange={(event, selectedDate) => {
                        setShowDatePicker(false);
                        if (selectedDate) {
                          const formatted = selectedDate.toISOString().split("T")[0];
                          updateField("birthdate", formatted);
                        }
                      }}
                    />
                  )}
                </View>
              ) : (
                <View className="flex-row justify-between items-center">
                  <Text style={{ color: colors.text }}>🎂 Date de naissance</Text>
                  <Text style={{ color: colors.textDark }}>{profile?.birthdate || "—"}</Text>
                </View>
              )}
            </View>

            {renderRow("⚖️ Poids", "weight", profile?.weight, isEditing, (v) =>
              updateField("weight", v)
            )}
            {renderRow("📏 Taille", "height", profile?.height, isEditing, (v) =>
              updateField("height", v)
            )}
            {/* 👧 Sexe */}
            <View className="mb-4">
              {isEditing ? (
                <View style={{ width: "100%" }}>
                  <Text style={{ color: colors.text, marginBottom: 4 }}>👧 Sexe</Text>
                  <TouchableOpacity
                    onPress={() => setShowGenderDropdown(!showGenderDropdown)}
                    className="flex-row justify-between items-center border-b border-gray-300 py-1"
                  >
                    <Text
                      style={{
                        color: profile?.gender ? colors.textDark : colors.textLight,
                      }}
                    >
                      {profile?.gender || "Sélectionner le sexe"}
                    </Text>
                    <ChevronDown color={colors.textDark} size={18} />
                  </TouchableOpacity>

                  {showGenderDropdown && (
                    <View
                      className="rounded-xl shadow-sm p-3 mt-1"
                      style={{ backgroundColor: colors.cardBackground }}
                    >
                      {["Fille", "Garçon"].map((option) => (
                        <TouchableOpacity
                          key={option}
                          onPress={() => {
                            updateField("gender", option);
                            setShowGenderDropdown(false);
                          }}
                          className={`py-2 rounded-xl ${profile?.gender === option ? "bg-gray-100" : ""}`}
                        >
                          <Text
                            style={{
                              color: profile?.gender === option ? colors.accent : colors.textDark,
                              fontWeight: profile?.gender === option ? "600" : "400",
                              textAlign: "left",
                            }}
                          >
                            {option}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              ) : (
                <View className="flex-row justify-between items-center">
                  <Text style={{ color: colors.text }}>👧 Sexe</Text>
                  <Text style={{ color: colors.textDark }}>{profile?.gender || "—"}</Text>
                </View>
              )}
            </View>
          </Card>

          {/* 💳 Paiement */}
          <Card title="Paiement">
            <View className="flex-row justify-between mb-2">
              <Text style={{ color: colors.text }}>Date limite</Text>
              <Text style={{ color: colors.textDark }}>
                {profile.nextPaymentDate || "Non définie"}
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text style={{ color: colors.text }}>Statut</Text>
              <Text style={{ color: paymentStatus.color, fontWeight: "600" }}>
                {paymentStatus.label}
              </Text>
            </View>
          </Card>

          {/* 🚑 Santé & Allergies */}
          <Card title="Santé & allergies">
            {renderRow("🤧 Allergies", "allergies", profile?.allergies, isEditing, (v) =>
              updateField("allergies", v)
            )}
            {renderRow("❤️ Conditions", "conditions", profile?.conditions, isEditing, (v) =>
              updateField("conditions", v)
            )}
            {renderRow("💊 Médication", "medication", profile?.medication, isEditing, (v) =>
              updateField("medication", v)
            )}
            {renderRow("👨‍⚕️ Médecin", "doctor", profile?.doctor, isEditing, (v) =>
              updateField("doctor", v)
            )}
          </Card>

          {/* 🚨 Contact d’urgence */}
          <Card title="Contact d’urgence">
            {renderRow(
              "👤 Nom",
              "emergencyContact.name",
              profile?.emergencyContact?.name,
              isEditing,
              (v) => updateField("emergencyContact", { ...profile?.emergencyContact, name: v })
            )}
            {renderRow(
              "👥 Relation",
              "emergencyContact.relation",
              profile?.emergencyContact?.relation,
              isEditing,
              (v) => updateField("emergencyContact", { ...profile?.emergencyContact, relation: v })
            )}
            {renderRow(
              "📞 Téléphone",
              "emergencyContact.phone",
              profile?.emergencyContact?.phone,
              isEditing,
              (v) => updateField("emergencyContact", { ...profile?.emergencyContact, phone: v }),
              handlePhoneCall
            )}
          </Card>

          {/* 🚗 Personnes autorisées */}
          <Card title="Personnes autorisées à récupérer l'enfant">
            {profile?.authorizedPickups?.length > 0 ? (
              profile.authorizedPickups.map((person: any, index: number) => (
                <View key={index} className="mb-3">
                  {renderRow(`👤 Nom ${index + 1}`, "", person.name, isEditing, (v) => {
                    const updated = [...profile.authorizedPickups];
                    updated[index] = { ...updated[index], name: v };
                    updateField("authorizedPickups", updated);
                  })}
                  {renderRow(
                    `📞 Téléphone ${index + 1}`,
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
                  {renderRow(`👥 Relation ${index + 1}`, "", person.relation, isEditing, (v) => {
                    const updated = [...profile.authorizedPickups];
                    updated[index] = { ...updated[index], relation: v };
                    updateField("authorizedPickups", updated);
                  })}
                </View>
              ))
            ) : (
              <Text style={{ color: colors.text }}>Aucune personne autorisée</Text>
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
                <Text style={{ color: colors.accent, fontWeight: "600" }}>+ Ajouter</Text>
              </TouchableOpacity>
            )}
          </Card>

          {/* 🎓 Informations sur la classe */}
          <Card title="Informations sur la classe">
            {renderRow(
              "👩‍🏫 Enseignant(e)",
              "classInfo.teacherName",
              profile?.classInfo?.teacherName,
              isEditing,
              (v) => updateField("classInfo", { ...profile?.classInfo, teacherName: v })
            )}
            {renderRow(
              "🚪 Salle",
              "classInfo.classroomName",
              profile?.classInfo?.classroomName,
              isEditing,
              (v) => updateField("classInfo", { ...profile?.classInfo, classroomName: v })
            )}
            {renderRow(
              "🧑 Responsable",
              "classInfo.responsibleName",
              profile?.classInfo?.responsibleName,
              isEditing,
              (v) => updateField("classInfo", { ...profile?.classInfo, responsibleName: v })
            )}
            {renderRow(
              "📞 Téléphone",
              "classInfo.responsiblePhone",
              profile?.classInfo?.responsiblePhone,
              isEditing,
              (v) => updateField("classInfo", { ...profile?.classInfo, responsiblePhone: v }),
              handlePhoneCall
            )}
          </Card>

          {/* 🔐 Identifiants d'accès parent */}
          {profile?.parent_username && (
            <Card title="🔐 Identifiants d'accès parent">
              <View
                style={{
                  padding: 16,
                  backgroundColor: "#F0F9FF",
                  borderLeftWidth: 4,
                  borderLeftColor: colors.accent,
                  borderRadius: 8,
                  marginBottom: 12,
                }}
              >
                <Text style={{ color: colors.textDark, fontWeight: "600", marginBottom: 12 }}>
                  Compte parent créé automatiquement
                </Text>

                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: colors.text, marginBottom: 4 }}>👤 Nom:</Text>
                  <Text style={{ color: colors.textDark, fontWeight: "500", fontSize: 15 }}>
                    {profile?.parent_name || "—"}
                  </Text>
                </View>

                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: colors.text, marginBottom: 4 }}>📧 Email:</Text>
                  <Text style={{ color: colors.textDark, fontWeight: "500", fontSize: 15 }}>
                    {profile?.parent_email || "—"}
                  </Text>
                </View>

                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: colors.text, marginBottom: 4 }}>👤 Identifiant:</Text>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ color: colors.textDark, fontWeight: "500", fontSize: 15, flex: 1 }}>
                      {profile?.parent_username || "—"}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        if (profile?.parent_username) {
                          Alert.alert("✅ Copié", `Identifiant copié: ${profile.parent_username}`);
                        }
                      }}
                    >
                      <Text style={{ color: colors.accent, fontWeight: "600", fontSize: 13 }}>
                        Copier
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View
                  style={{
                    marginTop: 12,
                    padding: 12,
                    backgroundColor: "#FEF3C7",
                    borderLeftWidth: 3,
                    borderLeftColor: "#F59E0B",
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: "#92400E", fontSize: 12, lineHeight: 18 }}>
                    ℹ️ Ces identifiants permettent au parent d'accéder à l'application mobile pour
                    suivre le profil de son enfant.
                  </Text>
                </View>
              </View>
            </Card>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/* 🧱 Ligne réutilisable */
function renderRow(
  label: string,
  key: string,
  value: string | undefined | null,
  editable: boolean,
  onChange: (v: string) => void,
  onPressPhone?: (v: string) => void
) {
  const displayValue = value ? value : "";
  const isPhoneField = label.toLowerCase().includes("téléphone");
  const isWeightField = label.toLowerCase().includes("poids");
  const isHeightField = label.toLowerCase().includes("taille");

  // Keyboard type logic
  const keyboardType = isPhoneField || isWeightField || isHeightField ? "numeric" : "default";

  // Display unit (only for read-only)
  const unit = !editable ? (isWeightField ? " kg" : isHeightField ? " cm" : "") : "";

  // Generic placeholder for all fields
  const placeholder = isPhoneField
    ? "Entrer un numéro"
    : isWeightField
      ? "Entrer le poids en Kg"
      : isHeightField
        ? "Entrer la taille en cm"
        : "Entrer une valeur";

  return (
    <View className="mb-4">
      {editable ? (
        // 🧱 Vertical layout when editing
        <View style={{ width: "100%" }}>
          <Text style={{ color: colors.text, marginBottom: 4 }}>{label}</Text>
          <TextInput
            value={displayValue}
            onChangeText={onChange}
            keyboardType={keyboardType}
            placeholder={placeholder}
            placeholderTextColor={colors.textLight}
            className="border-b border-gray-300 text-right py-1"
            style={{ color: colors.textDark, textAlign: "left", minWidth: 120 }}
          />
        </View>
      ) : (
        // 🧱 Horizontal layout when not editing
        <View
          className="flex-row justify-between items-start"
          style={{ flexWrap: "wrap", alignItems: "center" }}
        >
          <View style={{ flexShrink: 1, flexBasis: "40%" }}>
            <Text numberOfLines={2} ellipsizeMode="tail" style={{ color: colors.text }}>
              {label}
            </Text>
          </View>

          <View
            style={{
              flexShrink: 1,
              flexBasis: "58%",
              alignItems: "flex-end",
              flexDirection: "row",
              justifyContent: "flex-end",
            }}
          >
            {isPhoneField && displayValue ? (
              <TouchableOpacity onPress={() => onPressPhone && onPressPhone(displayValue)}>
                <Text
                  style={{
                    color: colors.accent,
                    textAlign: "right",
                    textDecorationLine: "underline",
                  }}
                >
                  {displayValue}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text
                style={{
                  color: displayValue ? colors.textDark : colors.textLight,
                  textAlign: "right",
                  fontStyle: displayValue ? "normal" : "italic",
                }}
              >
                {displayValue || "—"}
                {displayValue ? unit : ""}
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
}
