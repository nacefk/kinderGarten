import { router } from "expo-router";
import { Check, ChevronLeft, Pencil } from "lucide-react-native";
import { useState } from "react";
import { Alert, Linking } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ChevronDown } from "lucide-react-native";
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
const [showDatePicker, setShowDatePicker] = useState(false);
const [showGenderDropdown, setShowGenderDropdown] = useState(false);

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
  authorizedPickups: [
    { name: "Sarah Johnson", phone: "(555) 111-2233", class: "Butterflies" },
    { name: "Robert Green", phone: "(555) 222-3344", class: "Butterflies" },
    { name: "Emily Davis", phone: "(555) 333-4455", class: "Caterpillars" },
  ],
    classInfo: {
    teacherName: "Mrs. Emily Brown",
    teacherPhone: "(555) 987-1122",
    classroomName: "Room 3 – Butterflies",
    responsibleName: "Mr. James Miller",
    responsiblePhone: "(555) 444-8899",
  },

});


 const updateField = (key: string, value: string) => {
  setProfile((prev) => ({
    ...prev,
    [key]: value,
  }));
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
{/* 🎂 Birthdate */}
<View className="flex-row justify-between items-center mb-3">
  <Text className="text-gray-600">🎂 Birthdate</Text>

  {isEditing ? (
    <>
      <TouchableOpacity
        onPress={() => setShowDatePicker(true)}
        className="border-b border-gray-300 w-40"
      >
        <Text className="text-right text-gray-800 font-medium py-1">
          {profile.birthdate || "Select Date"}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={
            profile.birthdate
              ? new Date(profile.birthdate)
              : new Date(2022, 4, 14)
          }
          mode="date"
          display="default"
          maximumDate={new Date()} // prevent future dates
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              const formattedDate = selectedDate.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });
              updateField("birthdate", formattedDate);
            }
          }}
        />
      )}
    </>
  ) : (
    <Text className="text-gray-800 font-medium text-right">{profile.birthdate}</Text>
  )}
</View>
        {renderRow("⚖️ Weight", "weight", profile.weight, isEditing, (v) => updateField("weight", v))}
{renderRow("📏 Height", "height", profile.height, isEditing, (v) => updateField("height", v))}
{/* 👧 Gender */}
<View className="flex-row justify-between items-center mb-3">
  <Text className="text-gray-600">👧 Gender</Text>

  {isEditing ? (
    <TouchableOpacity
      onPress={() => setShowGenderDropdown(!showGenderDropdown)}
      className="flex-row justify-between items-center border-b border-gray-300 w-40"
    >
      <Text className="text-right text-gray-800 font-medium py-1">
        {profile.gender || "Select Gender"}
      </Text>
      <ChevronDown color="#374151" size={18} />
    </TouchableOpacity>
  ) : (
    <Text className="text-gray-800 font-medium text-right">{profile.gender}</Text>
  )}
</View>

{/* Dropdown options */}
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
          profile.gender === option ? "bg-[#EAF1FB]" : ""
        }`}
      >
        <Text
          className={`text-right ${
            profile.gender === option
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
      {renderRow("Allergies", "allergies", profile.allergies, isEditing, (v) => updateField("allergies", v))}
{renderRow("Conditions", "conditions", profile.conditions, isEditing, (v) => updateField("conditions", v))}
{renderRow("Medication", "medication", profile.medication, isEditing, (v) => updateField("medication", v))}
{renderRow("Doctor", "doctor", profile.doctor, isEditing, (v) => updateField("doctor", v))}

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
        {/* 🧍 Authorized Pick-Up */}
{/* 🧍 Authorized Pick-Up */}
<Card title="People Authorized to Pick Up">
  {profile.authorizedPickups.map((person, index) => (
    <TouchableOpacity
      key={index}
      onPress={() => {
        if (!isEditing && person.phone) {
          // Clean up the phone number: remove spaces, parentheses, and dashes
          const sanitizedNumber = person.phone.replace(/[^+\d]/g, "");

          const url = `tel:${sanitizedNumber}`;
          Linking.canOpenURL(url)
            .then((supported) => {
              if (supported) {
                Linking.openURL(url);
              } else {
                Alert.alert("Error", "Unable to open the phone dialer.");
              }
            })
            .catch(() => {
              Alert.alert("Error", "Something went wrong trying to make the call.");
            });
        }
      }}
      activeOpacity={isEditing ? 1 : 0.7}
      className={`flex-row justify-between items-center ${
        index !== profile.authorizedPickups.length - 1
          ? "border-b border-gray-200 mb-3 pb-3"
          : ""
      }`}
    >

      {/* Left side: name */}
      {isEditing ? (
        <TextInput
          value={person.name}
          onChangeText={(v) => {
            const updated = [...profile.authorizedPickups];
            updated[index].name = v;
            setProfile({ ...profile, authorizedPickups: updated });
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
            const updated = [...profile.authorizedPickups];
            updated[index].phone = v;
            setProfile({ ...profile, authorizedPickups: updated });
          }}
          className="border-b border-gray-300 text-right text-gray-800 w-40"
          placeholder="Phone Number"
          keyboardType="phone-pad"
        />
      ) : (
        <Text className="text-gray-800 text-right">{person.phone}</Text>
      )}
    </TouchableOpacity>
  ))}
</Card>

{/* 🎓 Class Information */}
<Card title="Class Information">
  {/* 👩‍🏫 Teacher */}
  {renderRow(
    "👩‍🏫 Teacher",
    "teacherName",
    profile.classInfo.teacherName,
    isEditing,
    (v) =>
      setProfile({
        ...profile,
        classInfo: { ...profile.classInfo, teacherName: v },
      })
  )}

  {/* 📞 Teacher Phone */}
  <View className="flex-row justify-between items-center mb-3">
    <Text className="text-gray-600">📞 Teacher Phone</Text>
    {isEditing ? (
      <TextInput
        value={profile.classInfo.teacherPhone}
        onChangeText={(v) =>
          setProfile({
            ...profile,
            classInfo: { ...profile.classInfo, teacherPhone: v },
          })
        }
        className="border-b border-gray-300 text-right text-gray-800 w-40"
        placeholder="Phone Number"
        keyboardType="phone-pad"
      />
    ) : (
      <TouchableOpacity
        onPress={() => {
          const sanitized = profile.classInfo.teacherPhone.replace(/[^+\d]/g, "");
          const url = `tel:${sanitized}`;
          Linking.canOpenURL(url)
            .then((supported) => {
              if (supported) Linking.openURL(url);
              else Alert.alert("Error", "Unable to open the dialer.");
            })
            .catch(() =>
              Alert.alert("Error", "Something went wrong while making the call.")
            );
        }}
      >
        <Text className="text-gray-800 font-medium text-right ">
          {profile.classInfo.teacherPhone}
        </Text>
      </TouchableOpacity>
    )}
  </View>

  {/* 🚪 Classroom */}
  {renderRow(
    "🚪 Classroom",
    "classroomName",
    profile.classInfo.classroomName,
    isEditing,
    (v) =>
      setProfile({
        ...profile,
        classInfo: { ...profile.classInfo, classroomName: v },
      })
  )}

  {/* 🧑 Responsible */}
  {renderRow(
    "🧑 Responsible",
    "responsibleName",
    profile.classInfo.responsibleName,
    isEditing,
    (v) =>
      setProfile({
        ...profile,
        classInfo: { ...profile.classInfo, responsibleName: v },
      })
  )}

  {/* 📞 Responsible Phone */}
  <View className="flex-row justify-between items-center">
    <Text className="text-gray-600">📞 Responsible Phone</Text>
    {isEditing ? (
      <TextInput
        value={profile.classInfo.responsiblePhone}
        onChangeText={(v) =>
          setProfile({
            ...profile,
            classInfo: { ...profile.classInfo, responsiblePhone: v },
          })
        }
        className="border-b border-gray-300 text-right text-gray-800 w-40"
        placeholder="Phone Number"
        keyboardType="phone-pad"
      />
    ) : (
      <TouchableOpacity
        onPress={() => {
          const sanitized = profile.classInfo.responsiblePhone.replace(/[^+\d]/g, "");
          const url = `tel:${sanitized}`;
          Linking.canOpenURL(url)
            .then((supported) => {
              if (supported) Linking.openURL(url);
              else Alert.alert("Error", "Unable to open the dialer.");
            })
            .catch(() =>
              Alert.alert("Error", "Something went wrong while making the call.")
            );
        }}
      >
        <Text className="text-gray-800 font-medium text-right ">
          {profile.classInfo.responsiblePhone}
        </Text>
      </TouchableOpacity>
    )}
  </View>
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
