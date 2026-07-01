import { useEffect } from "react";
import { router, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "@/lib/auth";
import { registerForPush, onNotificationTap } from "@/lib/push";
import { brand } from "@/theme";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNav />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function RootNav() {
  const { loading, session } = useAuth();

  // Register this device for push once signed in (idempotent; no-ops in Expo
  // Go / simulators / before `eas init`).
  useEffect(() => {
    if (session) registerForPush();
  }, [session]);

  // Tapping a notification deep-links to that candidate.
  useEffect(() => {
    const sub = onNotificationTap((applicationId) =>
      router.push(`/candidate/${applicationId}`)
    );
    return () => sub.remove();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: brand.cream }}>
        <ActivityIndicator color={brand.blue} size="large" />
      </View>
    );
  }
  // (tabs) and sign-in each redirect based on session — see their files.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="auth-callback" />
      <Stack.Screen
        name="candidate/[id]"
        options={{
          headerShown: true,
          headerTitle: "Candidate",
          headerStyle: { backgroundColor: brand.white },
          headerTitleStyle: { color: brand.ink, fontWeight: "800" },
          headerTintColor: brand.blueDeep,
          headerBackTitle: "Back",
        }}
      />
    </Stack>
  );
}
