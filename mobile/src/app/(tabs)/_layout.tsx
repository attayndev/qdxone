import { Redirect, Tabs } from "expo-router";
import { Text } from "react-native";
import { useAuth } from "@/lib/auth";
import { brand } from "@/theme";

export default function TabsLayout() {
  const { session } = useAuth();
  if (!session) return <Redirect href="/sign-in" />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: brand.pink,
        tabBarInactiveTintColor: brand.inkMuted,
        headerStyle: { backgroundColor: brand.white },
        headerTitleStyle: { color: brand.ink, fontWeight: "800" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Candidates",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>👥</Text>,
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          title: "Post a job",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>📣</Text>,
        }}
      />
      <Tabs.Screen
        name="interviews"
        options={{
          title: "Interviews",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>📅</Text>,
        }}
      />
    </Tabs>
  );
}
