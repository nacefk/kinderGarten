import { router } from "expo-router";
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
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAppStore } from "../../store/useAppStore";
import colors from "../../config/colors";
import Card from "../../components/Card";
import Row from "../../components/Row";

export default function Profile({ childId = "child_014" }) {
  const { childrenList, classes, setData } = useAppStore();

  const [isEditing, setIsEditing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [localProfile, setLocalProfile] = useState<any>(null);

  /** 🧮 Helper to calculate age */
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
    if (years < 1) return `${months} month${months > 1 ? "s" : ""}`;
    return `${years} year${years > 1 ? "s" : ""}${months > 0 ? ` ${months} mo` : ""}`;
  };

  /** 📦 Build child data dynamically */
  useEffect(() => {
    if (!childrenList || !classes) return;

    const child = childrenList.find((c: any) => c.id === childId);
    if (!child) return;

    // find the class for this child
    const classInfo = classes.find((cl: any) => cl.name === child.className);

    const fullProfile = {
      id: child.id,
      name: child.name,
      avatar: child.avatar,
      group: child.className || "Unknown Class",
      birthdate: child.birthdate || "2020-01-01",
      age: child.age || getAge(child.birthdate || "2020-01-01"),
      weight: child.weight || "N/A",
      height: child.height || "N/A",
      gender: child.gender || "Female",
      allergies: child.allergies || "None",
      conditions: child.medicalNote || "None",
      medication: "N/A",
      doctor: classInfo ? `${classInfo.teacher} — ${classInfo.room}` : "N/A",
      emergencyContact: child.emergencyContact || {
        name: "N/A",
        relation: "N/A",
        phone: "N/A",
      },
      authorizedPickups: child.authorizedPickups || [],
      classInfo: {
        teacherName: classInfo?.teacher || "Unknown",
        teacherPhone: "",
        classroomName: classInfo?.room || "N/A",
        responsibleName: classInfo?.assistant || "N/A",
        responsiblePhone: "",
      },
    };

    setLocalProfile(fullProfile);
    setData("profile", fullProfile); // sync with store
  }, [childId, childrenList, classes]);

  const updateField = (key: string, value: any) => {
    setLocalProfile((prev: any) => ({ ...prev, [key]: value }));
  };

  const saveProfile = () => {
    setData("profile", localProfile);
    setIsEditing(false);
  };

  const handlePhoneCall = (phone: string) => {
    if (!phone || phone === "N/A") return;
    const sanitized = phone.replace(/[^+\d]/g, "");
    const url = `tel:${sanitized}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) Linking.openURL(url);
        else Alert.alert("Error", "Unable to open the dialer.");
      })
      .catch(() => Alert.alert("Error", "Something went wrong while making the call."));
  };

  if (!localProfile) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <Text style={{ color: colors.textLight }}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar barStyle={"dark-content"} />

      {/* Header */}
      <View
        className="flex-row items-center justify-between px-5 pt-16 pb-6"
        style={{ backgroundColor: colors.accentLight }}
      >
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ChevronLeft color={colors.textDark} size={28} />
          </TouchableOpacity>
          <Text className="text-2xl font-bold" style={{ color: colors.textDark }}>
            Profile
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            if (isEditing) saveProfile();
            else setIsEditing(true);
          }}
        >
          {isEditing ? (
            <Check color={colors.textDark} size={26} />
          ) : (
            <Pencil color={colors.textDark} size={24} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* 👶 Child Info */}
        <Card title="Child Info">
          <View className="items-center">
            <Image
              source={{ uri: localProfile?.avatar }}
              className="w-28 h-28 rounded-full mb-3"
            />
            {isEditing ? (
              <>
                <TextInput
                  value={localProfile?.name}
                  onChangeText={(t) => updateField("name", t)}
                  className="text-center text-xl font-semibold border-b border-gray-300 w-48 mb-1"
                  style={{ color: colors.textDark }}
                />
                <TextInput
                  value={localProfile?.group}
                  onChangeText={(t) => updateField("group", t)}
                  className="text-center border-b border-gray-300 w-48"
                  style={{ color: colors.text }}
                />
              </>
            ) : (
              <>
                <Text
                  className="text-xl font-semibold"
                  style={{ color: colors.textDark }}
                >
                  {localProfile?.name}
                </Text>
                <Text style={{ color: colors.text, marginTop: 4 }}>
                  {getAge(localProfile?.birthdate)} • {localProfile?.group}
                </Text>
              </>
            )}
          </View>
        </Card>

        {/* 📏 Physical Info */}
        <Card title="Physical Info">
          {/* 🎂 Birthdate */}
          <Row label="🎂 Birthdate">
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
                    {localProfile?.birthdate || "Select Date"}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={new Date(localProfile?.birthdate || "2020-01-01")}
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
              <Text
                className="font-medium text-right"
                style={{ color: colors.textDark }}
              >
                {localProfile?.birthdate}
              </Text>
            )}
          </Row>

          {/* ⚖️ Weight */}
          {renderRow("⚖️ Weight", "weight", localProfile?.weight, isEditing, (v) =>
            updateField("weight", v)
          )}

          {/* 📏 Height */}
          {renderRow("📏 Height", "height", localProfile?.height, isEditing, (v) =>
            updateField("height", v)
          )}

          {/* 👧 Gender */}
          <Row label="👧 Gender">
            {isEditing ? (
              <TouchableOpacity
                onPress={() => setShowGenderDropdown(!showGenderDropdown)}
                className="flex-row justify-between items-center border-b border-gray-300 w-40"
              >
                <Text
                  className="text-right font-medium py-1"
                  style={{ color: colors.textDark }}
                >
                  {localProfile?.gender || "Select Gender"}
                </Text>
                <ChevronDown color={colors.textDark} size={18} />
              </TouchableOpacity>
            ) : (
              <Text
                className="font-medium text-right"
                style={{ color: colors.textDark }}
              >
                {localProfile?.gender}
              </Text>
            )}
          </Row>

          {showGenderDropdown && isEditing && (
            <View
              className="rounded-xl shadow-sm p-3 mt-1"
              style={{ backgroundColor: colors.cardBackground }}
            >
              {["Female", "Male"].map((option) => (
                <TouchableOpacity
                  key={option}
                  onPress={() => {
                    updateField("gender", option);
                    setShowGenderDropdown(false);
                  }}
                  className={`py-2 rounded-xl ${
                    localProfile?.gender === option ? "bg-gray-100" : ""
                  }`}
                >
                  <Text
                    className="text-right"
                    style={{
                      color:
                        localProfile?.gender === option
                          ? colors.accent
                          : colors.textDark,
                      fontWeight: localProfile?.gender === option ? "600" : "400",
                    }}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Card>

        {/* 🚑 Health Info */}
        <Card title="Health & Allergies">
          {renderRow("Allergies", "allergies", localProfile?.allergies, isEditing, (v) =>
            updateField("allergies", v)
          )}
          {renderRow("Conditions", "conditions", localProfile?.conditions, isEditing, (v) =>
            updateField("conditions", v)
          )}
          {renderRow("Medication", "medication", localProfile?.medication, isEditing, (v) =>
            updateField("medication", v)
          )}
          {renderRow("Doctor", "doctor", localProfile?.doctor, isEditing, (v) =>
            updateField("doctor", v)
          )}
        </Card>

        {/* 🚨 Emergency Contact */}
        <Card title="Emergency Contact">
          {renderRow("Name", "emergencyContact.name", localProfile?.emergencyContact?.name, isEditing, (v) =>
            updateField("emergencyContact", { ...localProfile?.emergencyContact, name: v })
          )}
          {renderRow("Relation", "emergencyContact.relation", localProfile?.emergencyContact?.relation, isEditing, (v) =>
            updateField("emergencyContact", { ...localProfile?.emergencyContact, relation: v })
          )}
          {renderRow("Phone", "emergencyContact.phone", localProfile?.emergencyContact?.phone, isEditing, (v) =>
            updateField("emergencyContact", { ...localProfile?.emergencyContact, phone: v })
          )}
        </Card>

        {/* 🎓 Class Info */}
        <Card title="Class Information">
          {renderRow("👩‍🏫 Teacher", "classInfo.teacherName", localProfile?.classInfo?.teacherName, isEditing, (v) =>
            updateField("classInfo", { ...localProfile?.classInfo, teacherName: v })
          )}
          {renderRow("🚪 Classroom", "classInfo.classroomName", localProfile?.classInfo?.classroomName, isEditing, (v) =>
            updateField("classInfo", { ...localProfile?.classInfo, classroomName: v })
          )}
          {renderRow("🧑 Responsible", "classInfo.responsibleName", localProfile?.classInfo?.responsibleName, isEditing, (v) =>
            updateField("classInfo", { ...localProfile?.classInfo, responsibleName: v })
          )}
          {renderRow("📞 Responsible Phone", "classInfo.responsiblePhone", localProfile?.classInfo?.responsiblePhone, isEditing, (v) =>
            updateField("classInfo", { ...localProfile?.classInfo, responsiblePhone: v })
          )}
        </Card>
      </ScrollView>
    </View>
  );
}

/* 🧱 Reusable row helper */
function renderRow(
  label: string,
  key: string,
  value: string,
  editable: boolean,
  onChange: (v: string) => void
) {
  return (
    <View className="flex-row justify-between items-center mb-3">
      <Text style={{ color: colors.text }}>{label}</Text>
      {editable ? (
        <TextInput
          value={value}
          onChangeText={onChange}
          className="border-b border-gray-300 text-right w-40"
          style={{ color: colors.textDark }}
        />
      ) : (
        <Text
          className="font-medium text-right"
          style={{ color: colors.textDark }}
        >
          {value}
        </Text>
      )}
    </View>
  );
}
