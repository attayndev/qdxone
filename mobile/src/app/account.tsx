import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useAuth } from "@/lib/auth";
import { brand, feedback } from "@/theme";

const WEB = process.env.EXPO_PUBLIC_API_URL ?? "https://qdx.one";

/** Account & legal: privacy/terms, account deletion (on the web), and sign out. */
export default function Account() {
  const router = useRouter();
  const { session, signOut } = useAuth();

  const Row = ({
    label,
    onPress,
    tone = "default",
  }: {
    label: string;
    onPress: () => void;
    tone?: "default" | "danger";
  }) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: pressed ? brand.soft : brand.white,
        borderBottomWidth: 1,
        borderBottomColor: brand.line,
      })}
    >
      <Text
        style={{
          fontSize: 16,
          fontWeight: "600",
          color: tone === "danger" ? feedback.dangerSolid : brand.ink,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: brand.cream }} edges={["top"]}>
      <View style={{ flexDirection: "row", alignItems: "center", padding: 16, gap: 12 }}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: brand.blueDeep, fontWeight: "600", fontSize: 16 }}>‹ Back</Text>
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: "800", color: brand.ink }}>Account</Text>
      </View>

      <ScrollView>
        <Text style={{ color: brand.inkMuted, fontSize: 13, paddingHorizontal: 16, paddingBottom: 8 }}>
          Signed in as {session?.user.email}
        </Text>

        <Row label="Privacy Policy" onPress={() => WebBrowser.openBrowserAsync(`${WEB}/privacy`)} />
        <Row label="Terms of Service" onPress={() => WebBrowser.openBrowserAsync(`${WEB}/terms`)} />
        <Row label="Delete account" onPress={() => WebBrowser.openBrowserAsync(`${WEB}/account/delete`)} />

        <View style={{ height: 24 }} />
        <Row label="Sign out" tone="danger" onPress={signOut} />
      </ScrollView>
    </SafeAreaView>
  );
}
