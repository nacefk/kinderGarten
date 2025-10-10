import { router } from "expo-router";
import { Check, ChevronLeft, Pencil, ChevronDown } from "lucide-react-native";
import { useState } from "react";
import { Alert, Linking, Text, TextInput, TouchableOpacity, View, Image, ScrollView, StatusBar } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAppStore } from "../../store/useAppStore"; // ✅ Zustand import

export default function Profile() {
  const { profile, setData } = useAppStore();
  // Local edit states
  const [isEditing, setIsEditing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [localProfile, setLocalProfile] = useState(profile);

// 🧮 Helper to calculate age based on birthdate
const getAge = (birthdate?: string) => {
  if (!birthdate) return "";
  const parsed = new Date(birthdate);
  if (isNaN(parsed.getTime())) return ""; // invalid date

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
    setLocalProfile((prev) => ({
      ...prev,
      [key]: value,
    }));
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
      .catch(() =>
        Alert.alert("Error", "Something went wrong while making the call.")
      );
  };

  return (
    <View className="flex-1 bg-[#FAF8F5]">
      <StatusBar barStyle={"dark-content"} />

      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-16 pb-6 bg-[#EAF1FB]">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ChevronLeft color="#374151" size={28} />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-800">Profile</Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            if (isEditing) saveProfile();
            else setIsEditing(true);
          }}
        >
          {isEditing ? <Check color="#374151" size={26} /> : <Pencil color="#374151" size={24} />}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        {/* 👶 Child Info */}
        <View className="bg-white rounded-2xl shadow-sm p-5 mt-6 items-center">
          <Image
            source={{ uri: localProfile?.avatar }}
            className="w-28 h-28 rounded-full mb-3"
          />
          {isEditing ? (
            <>
              <TextInput
                value={localProfile?.name}
                onChangeText={(t) => updateField("name", t)}
                className="text-center text-xl font-semibold text-gray-800 border-b border-gray-300 w-48 mb-1"
              />
              <TextInput
                value={localProfile?.group}
                onChangeText={(t) => updateField("group", t)}
                className="text-center text-gray-500 border-b border-gray-300 w-48"
              />
            </>
          ) : (
            <>
              <Text className="text-xl font-semibold text-gray-800">
                {localProfile?.name}
              </Text>
              <Text className="text-gray-500 mt-1">
  {getAge(localProfile?.birthdate)} • {localProfile?.group}
</Text>

            </>
          )}
        </View>

        {/* 📏 Physical Info */}
        <Card title="Physical Info">
          <Row label="🎂 Birthdate">
            {isEditing ? (
              <>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} className="border-b border-gray-300 w-40">
                  <Text className="text-right text-gray-800 font-medium py-1">
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
    const formatted = selectedDate.toISOString().split("T")[0]; // ✅ store ISO format
    const newAge = getAge(formatted);
    updateField("birthdate", formatted);
    updateField("age", newAge); // ✅ update computed age immediately
  }
}}

                  />
                )}
              </>
            ) : (
              <Text className="text-gray-800 font-medium text-right">
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
                <Text className="text-right text-gray-800 font-medium py-1">
                  {localProfile?.gender || "Select Gender"}
                </Text>
                <ChevronDown color="#374151" size={18} />
              </TouchableOpacity>
            ) : (
              <Text className="text-gray-800 font-medium text-right">{localProfile?.gender}</Text>
            )}
          </Row>

          {showGenderDropdown && isEditing && (
            <View className="bg-white rounded-xl shadow-sm p-3 mt-1">
              {["Female", "Male"].map((option) => (
                <TouchableOpacity
                  key={option}
                  onPress={() => {
                    updateField("gender", option);
                    setShowGenderDropdown(false);
                  }}
                  className={`py-2 rounded-xl ${
                    localProfile?.gender === option ? "bg-[#EAF1FB]" : ""
                  }`}
                >
                  <Text
                    className={`text-right ${
                      localProfile?.gender === option
                        ? "text-[#C6A57B] font-semibold"
                        : "text-gray-700"
                    }`}
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
          {renderRow(
            "Name",
            "emergencyContact.name",
            localProfile?.emergencyContact?.name,
            isEditing,
            (v) =>
              updateField("emergencyContact", {
                ...localProfile?.emergencyContact,
                name: v,
              })
          )}
          {renderRow(
            "Relation",
            "emergencyContact.relation",
            localProfile?.emergencyContact?.relation,
            isEditing,
            (v) =>
              updateField("emergencyContact", {
                ...localProfile?.emergencyContact,
                relation: v,
              })
          )}
          {renderRow(
            "Phone",
            "emergencyContact.phone",
            localProfile?.emergencyContact?.phone,
            isEditing,
            (v) =>
              updateField("emergencyContact", {
                ...localProfile?.emergencyContact,
                phone: v,
              })
          )}
        </Card>
{/* 🧍 Authorized Pick-Up */}
<Card title="People Authorized to Pick Up">
  {localProfile?.authorizedPickups?.length > 0 ? (
    localProfile.authorizedPickups.map((person, index) => (
      <TouchableOpacity
        key={index}
        onPress={() => {
          if (!isEditing && person.phone) {
            const sanitized = person.phone.replace(/[^+\d]/g, "");
            const url = `tel:${sanitized}`;
            Linking.canOpenURL(url)
              .then((supported) => {
                if (supported) Linking.openURL(url);
                else Alert.alert("Error", "Unable to open the phone dialer.");
              })
              .catch(() => Alert.alert("Error", "Something went wrong."));
          }
        }}
        activeOpacity={isEditing ? 1 : 0.7}
        className={`flex-row justify-between items-center ${
          index !== localProfile.authorizedPickups.length - 1
            ? "border-b border-gray-200 mb-3 pb-3"
            : ""
        }`}
      >
        {/* Left side: name */}
        {isEditing ? (
          <TextInput
            value={person.name}
            onChangeText={(v) => {
              const updated = [...localProfile.authorizedPickups];
              updated[index].name = v;
              updateField("authorizedPickups", updated);
            }}
            className="border-b border-gray-300 text-gray-800 w-40"
            placeholder="Name"
          />
        ) : (
          <Text className="text-gray-800 font-medium">{person.name}</Text>
        )}

        {/* Right side: phone */}
        {isEditing ? (
          <TextInput
            value={person.phone}
            onChangeText={(v) => {
              const updated = [...localProfile.authorizedPickups];
              updated[index].phone = v;
              updateField("authorizedPickups", updated);
            }}
            className="border-b border-gray-300 text-right text-gray-800 w-40"
            placeholder="Phone Number"
            keyboardType="phone-pad"
          />
        ) : (
          <Text className="text-gray-800 text-right">{person.phone}</Text>
        )}
      </TouchableOpacity>
    ))
  ) : (
    <Text className="text-gray-500">No authorized people added.</Text>
  )}

  {/* Add new person when editing */}
  {isEditing && (
    <TouchableOpacity
      onPress={() => {
        const updated = [
          ...localProfile.authorizedPickups,
          { name: "", phone: "" },
        ];
        updateField("authorizedPickups", updated);
      }}
      className="mt-4 border border-dashed border-[#C6A57B] rounded-xl py-2"
    >
      <Text className="text-center text-[#C6A57B] font-medium">
        + Add Authorized Person
      </Text>
    </TouchableOpacity>
  )}
</Card>
        {/* 🎓 Class Info */}
        <Card title="Class Information">
          {renderRow(
            "👩‍🏫 Teacher",
            "classInfo.teacherName",
            localProfile?.classInfo?.teacherName,
            isEditing,
            (v) =>
              updateField("classInfo", {
                ...localProfile?.classInfo,
                teacherName: v,
              })
          )}
          {renderRow(
            "🚪 Classroom",
            "classInfo.classroomName",
            localProfile?.classInfo?.classroomName,
            isEditing,
            (v) =>
              updateField("classInfo", {
                ...localProfile?.classInfo,
                classroomName: v,
              })
          )}
          {renderRow(
            "🧑 Responsible",
            "classInfo.responsibleName",
            localProfile?.classInfo?.responsibleName,
            isEditing,
            (v) =>
              updateField("classInfo", {
                ...localProfile?.classInfo,
                responsibleName: v,
              })
          )}

          {/* 📞 Responsible Phone */}
          <View className="flex-row justify-between items-center">
            <Text className="text-gray-600">📞 Responsible Phone</Text>
            {isEditing ? (
              <TextInput
                value={localProfile?.classInfo?.responsiblePhone}
                onChangeText={(v) =>
                  updateField("classInfo", {
                    ...localProfile?.classInfo,
                    responsiblePhone: v,
                  })
                }
                className="border-b border-gray-300 text-right text-gray-800 w-40"
                placeholder="Phone Number"
                keyboardType="phone-pad"
              />
            ) : (
              <TouchableOpacity onPress={() => handlePhoneCall(localProfile?.classInfo?.responsiblePhone)}>
                <Text className="text-gray-800 font-medium text-right">
                  {localProfile?.classInfo?.responsiblePhone}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

/* 🔧 Reusable Components */
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="bg-white rounded-2xl shadow-sm p-5 mt-6">
      <Text className="text-lg font-semibold text-gray-800 mb-3">{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="flex-row justify-between items-center mb-3">
      <Text className="text-gray-600">{label}</Text>
      {children}
    </View>
  );
}

function renderRow(
  label: string,
  key: string,
  value: string,
  editable: boolean,
  onChange: (v: string) => void
) {
  return (
    <View className="flex-row justify-between items-center mb-3">
      <Text className="text-gray-600">{label}</Text>
      {editable ? (
        <TextInput
          value={value}
          onChangeText={onChange}
          className="border-b border-gray-300 text-right text-gray-800 w-40"
        />
      ) : (
        <Text className="text-gray-800 font-medium text-right">{value}</Text>
      )}
    </View>
  );
}
