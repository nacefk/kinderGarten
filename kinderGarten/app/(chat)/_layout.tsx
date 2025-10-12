import { Stack } from "expo-router";

export default function ChatLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* This ensures [conversationId].tsx behaves as a sub-screen */}
      <Stack.Screen name="[conversation]" />
    </Stack>
  );
}
