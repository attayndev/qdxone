import { ScrollView, Text, View } from "react-native";
import { brand } from "@/theme";

export function Placeholder({ emoji, title, body }: { emoji: string; title: string; body: string }) {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: brand.cream }} contentContainerStyle={{ padding: 20 }}>
      <View style={{ backgroundColor: brand.white, borderRadius: 16, borderWidth: 1, borderColor: brand.line, padding: 24, alignItems: "center" }}>
        <Text style={{ fontSize: 44 }}>{emoji}</Text>
        <Text style={{ marginTop: 10, fontSize: 18, fontWeight: "800", color: brand.ink, textAlign: "center" }}>{title}</Text>
        <Text style={{ marginTop: 8, color: brand.inkMuted, textAlign: "center", lineHeight: 21 }}>{body}</Text>
      </View>
    </ScrollView>
  );
}
