import { router } from "expo-router";
import { Check, ChevronLeft, Pencil } from "lucide-react-native";
import { useState } from "react";
import {
  Image,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);

  const [profile, setProfile] = useState({
    name: "Emma Johnson",
    group: "Butterflies",
    age: "3 years",
    birthdate: "14 May 2022",
    weight: "14.2 kg",
    height: "94 cm",
    gender: "Female",
    allergies: "Peanuts",
    conditions: "Asthma",
    medication: "Ventolin (as needed)",
    doctor: "Dr. Williams — (555) 678-9012",
    emergencyContact: {
      name: "Robert Green",
      relation: "Grandfather",
      phone: "(555) 222-3344",
    },
  });

  const updateField = (key: string, value: string) => {
    setProfile({ ...profile, [key]: value });
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
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
          {isEditing ? (
            <Check color="#374151" size={26} />
          ) : (
            <Pencil color="#374151" size={24} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* 👶 Child Info */}
        <View className="bg-white rounded-2xl shadow-sm p-5 mt-6 items-center">
          <Image
            source={{ uri: "https://i.pravatar.cc/150?img=5" }}
            className="w-28 h-28 rounded-full mb-3"
          />
          {isEditing ? (
            <>
              <TextInput
                value={profile.name}
                onChangeText={(t) => updateField("name", t)}
                className="text-center text-xl font-semibold text-gray-800 border-b border-gray-300 w-48 mb-1"
              />
              <TextInput
                value={profile.group}
                onChangeText={(t) => updateField("group", t)}
                className="text-center text-gray-500 border-b border-gray-300 w-48"
              />
            </>
          ) : (
            <>
              <Text className="text-xl font-semibold text-gray-800">
                {profile.name}
              </Text>
              <Text className="text-gray-500 mt-1">
                {profile.age} • {profile.group}
              </Text>
            </>
          )}
        </View>

        {/* 📏 Physical Info */}
        <Card title="Physical Info">
          {renderRow("🎂 Birthdate", "birthdate", profile.birthdate, isEditing, updateField)}
          {renderRow("⚖️ Weight", "weight", profile.weight, isEditing, updateField)}
          {renderRow("📏 Height", "height", profile.height, isEditing, updateField)}
          {renderRow("👧 Gender", "gender", profile.gender, isEditing, updateField)}
        </Card>

        {/* 🚑 Health Info */}
        <Card title="Health & Allergies">
          {renderRow("Allergies", "allergies", profile.allergies, isEditing, updateField)}
          {renderRow("Conditions", "conditions", profile.conditions, isEditing, updateField)}
          {renderRow("Medication", "medication", profile.medication, isEditing, updateField)}
          {renderRow("Doctor", "doctor", profile.doctor, isEditing, updateField)}
        </Card>

        {/* 🚨 Emergency Contact */}
        <Card title="Emergency Contact">
          {renderRow(
            "Name",
            "emergencyName",
            profile.emergencyContact.name,
            isEditing,
            (v) =>
              setProfile({
                ...profile,
                emergencyContact: { ...profile.emergencyContact, name: v },
              })
          )}
          {renderRow(
            "Relation",
            "emergencyRelation",
            profile.emergencyContact.relation,
            isEditing,
            (v) =>
              setProfile({
                ...profile,
                emergencyContact: { ...profile.emergencyContact, relation: v },
              })
          )}
          {renderRow(
            "Phone",
            "emergencyPhone",
            profile.emergencyContact.phone,
            isEditing,
            (v) =>
              setProfile({
                ...profile,
                emergencyContact: { ...profile.emergencyContact, phone: v },
              })
          )}
        </Card>

        {/* Buttons */}
        {!isEditing && (
          <View className="mt-8 mb-10">
            <TouchableOpacity
              className="bg-[#C6A57B] py-4 rounded-2xl mb-3"
              onPress={() => setIsEditing(true)}
            >
              <Text className="text-center text-white font-semibold text-base">
                Edit Info
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="border border-[#C6A57B] py-4 rounded-2xl"
              onPress={() => router.replace("/(tabs)/home")}
            >
              <Text className="text-center text-[#C6A57B] font-semibold text-base">
                Back to Home
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/* 🔧 Reusable Card Component */
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="bg-white rounded-2xl shadow-sm p-5 mt-6">
      <Text className="text-lg font-semibold text-gray-800 mb-3">{title}</Text>
      {children}
    </View>
  );
}

/* 🔧 Reusable Row Renderer */
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
