import { Tabs } from "expo-router";
import { Text } from "react-native";

import { colors } from "@/constants/theme";

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

export default function ResponderLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.teal,
        tabBarInactiveTintColor: colors.gray,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Home", tabBarIcon: () => <TabIcon emoji="🚑" /> }}
      />
      <Tabs.Screen
        name="verification"
        options={{ title: "Verification", tabBarIcon: () => <TabIcon emoji="🪪" /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: "Profile", tabBarIcon: () => <TabIcon emoji="👤" /> }}
      />
    </Tabs>
  );
}
