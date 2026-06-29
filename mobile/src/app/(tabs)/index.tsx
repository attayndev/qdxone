import { Pressable, ScrollView, Text, View } from "react-native";
import { useAuth } from "@/lib/auth";
import { brand } from "@/theme";

export default function Candidates() {
  const { session, signOut } = useAuth();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: brand.cream }} contentContainerStyle={{ padding: 20 }}>
      <View style={{ backgroundColor: brand.white, borderRadius: 16, borderWidth: 1, borderColor: brand.line, padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: "800", color: brand.ink }}>You&apos;re signed in 🎉</Text>
        <Text style={{ marginTop: 6, color: brand.inkMuted }}>{session?.user.email}</Text>
        <Text style={{ marginTop: 14, color: brand.inkMuted, lineHeight: 21 }}>
          Your applicants — name, role, and fit score — will list here. Tap one for
          the report card and to record a decision. Real data wires in the next build.
        </Text>
        <Pressable
          onPress={signOut}
          style={{
            marginTop: 18,
            alignSelf: "flex-start",
            borderWidth: 1,
            borderColor: brand.line,
            borderRadius: 9999,
            paddingHorizontal: 16,
            paddingVertical: 10,
          }}
        >
          <Text style={{ color: brand.ink, fontWeight: "600" }}>Sign out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
