import { router } from "expo-router";
import { Check, ChevronLeft, Pencil, ChevronDown } from "lucide-react-native";
import { useState } from "react";
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

export default function Profile() {
  const { profile, setData } = useAppStore();

  const [isEditing, setIsEditing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [localProfile, setLocalProfile] = useState(profile);

  // 🧮 Helper to calculate age based on birthdate
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

  const updateField = (key: string, value: any) => {
    setLocalProfile((prev) => ({ ...prev, [key]: value }));
  };

  const saveProfile = () => {
    setData("profile", localProfile);
    setIsEditing(false);
  };

  const handlePhoneCall = (phone: string) => {
    const sanitized = phone.replace(/[^+\d]/g, "");
    const url = `tel:${sanitized}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) Linking.openURL(url);
        else Alert.alert("Error", "Unable to open the dialer.");
      })
      .catch(() => Alert.alert("Error", "Something went wrong while making the call."));
  };

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

          {renderRow("⚖️ Weight", "weight", localProfile?.weight, isEditing, (v) =>
            updateField("weight", v)
          )}
          {renderRow("📏 Height", "height", localProfile?.height, isEditing, (v) =>
            updateField("height", v)
          )}

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

        {/* 🧍 Authorized Pick-Up */}
        <Card title="Authorized Pick-Up">
          {localProfile?.authorizedPickups?.length > 0 ? (
            localProfile.authorizedPickups.map((person, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => !isEditing && person.phone && handlePhoneCall(person.phone)}
                activeOpacity={isEditing ? 1 : 0.7}
                className={`flex-row justify-between items-center ${
                  index !== localProfile.authorizedPickups.length - 1
                    ? "border-b border-gray-200 mb-3 pb-3"
                    : ""
                }`}
              >
                {isEditing ? (
                  <>
                    <TextInput
                      value={person.name}
                      onChangeText={(v) => {
                        const updated = [...localProfile.authorizedPickups];
                        updated[index].name = v;
                        updateField("authorizedPickups", updated);
                      }}
                      className="border-b border-gray-300 w-40"
                      style={{ color: colors.textDark }}
                      placeholder="Name"
                    />
                    <TextInput
                      value={person.phone}
                      onChangeText={(v) => {
                        const updated = [...localProfile.authorizedPickups];
                        updated[index].phone = v;
                        updateField("authorizedPickups", updated);
                      }}
                      className="border-b border-gray-300 text-right w-40"
                      style={{ color: colors.textDark }}
                      placeholder="Phone Number"
                      keyboardType="phone-pad"
                    />
                  </>
                ) : (
                  <>
                    <Text style={{ color: colors.textDark, fontWeight: "500" }}>
                      {person.name}
                    </Text>
                    <Text style={{ color: colors.textDark }}>{person.phone}</Text>
                  </>
                )}
              </TouchableOpacity>
            ))
          ) : (
            <Text style={{ color: colors.textLight }}>No authorized people added.</Text>
          )}

          {isEditing && (
            <TouchableOpacity
              onPress={() =>
                updateField("authorizedPickups", [
                  ...localProfile.authorizedPickups,
                  { name: "", phone: "" },
                ])
              }
              className="mt-4 border border-dashed rounded-xl py-2"
              style={{ borderColor: colors.accent }}
            >
              <Text
                className="text-center font-medium"
                style={{ color: colors.accent }}
              >
                + Add Authorized Person
              </Text>
            </TouchableOpacity>
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
          <Row label="📞 Responsible Phone">
            {isEditing ? (
              <TextInput
                value={localProfile?.classInfo?.responsiblePhone}
                onChangeText={(v) =>
                  updateField("classInfo", { ...localProfile?.classInfo, responsiblePhone: v })
                }
                className="border-b border-gray-300 text-right w-40"
                style={{ color: colors.textDark }}
                placeholder="Phone Number"
                keyboardType="phone-pad"
              />
            ) : (
              <TouchableOpacity
                onPress={() => handlePhoneCall(localProfile?.classInfo?.responsiblePhone)}
              >
                <Text
                  className="font-medium text-right"
                  style={{ color: colors.textDark }}
                >
                  {localProfile?.classInfo?.responsiblePhone}
                </Text>
              </TouchableOpacity>
            )}
          </Row>
        </Card>
      </ScrollView>
    </View>
  );
}

/* 🧱 Helper for inline editable rows */
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
