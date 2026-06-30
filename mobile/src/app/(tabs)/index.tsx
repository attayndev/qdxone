import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { useAuth } from "@/lib/auth";
import { apiGet } from "@/lib/api";
import { brand } from "@/theme";

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  submittedAt: string;
  fit: string | null;
  decision: string | null;
}

const FIT_COLOR: Record<string, { bg: string; fg: string }> = {
  "Strong fit": { bg: "#dcfce7", fg: "#166534" },
  Consider: { bg: brand.pink50, fg: brand.pink600 },
  Caution: { bg: "#fef3c7", fg: brand.amber },
  "Not recommended": { bg: "#fee2e2", fg: "#b91c1c" },
  Incomplete: { bg: "#f1f5f9", fg: brand.inkMuted },
};

const STATUS_LABEL: Record<string, string> = {
  new: "New",
  assessment_sent: "Assessment sent",
  assessment_complete: "Assessment complete",
  decision_made: "Decision made",
};

export default function Candidates() {
  const { session, signOut } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await apiGet<{ candidates: Candidate[] }>("/api/mobile/candidates");
      setCandidates(data.candidates);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load candidates");
      setCandidates([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  if (candidates === null) {
    return (
      <View style={{ flex: 1, backgroundColor: brand.cream, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={brand.pink} size="large" />
      </View>
    );
  }

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: brand.cream }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      data={candidates}
      keyExtractor={(c) => c.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={brand.pink} />}
      ListHeaderComponent={
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <Text style={{ color: brand.inkMuted, fontSize: 13 }} numberOfLines={1}>
            {session?.user.email}
          </Text>
          <Pressable onPress={signOut}>
            <Text style={{ color: brand.pink600, fontWeight: "600", fontSize: 13 }}>Sign out</Text>
          </Pressable>
        </View>
      }
      ListEmptyComponent={
        <View style={{ padding: 24, alignItems: "center" }}>
          <Text style={{ fontSize: 40 }}>🗂️</Text>
          <Text style={{ marginTop: 8, color: brand.inkMuted, textAlign: "center" }}>
            {error ? error : "No applicants yet. Share a posting's link or QR to start collecting candidates."}
          </Text>
        </View>
      }
      renderItem={({ item }) => {
        const fit = item.fit ? FIT_COLOR[item.fit] ?? FIT_COLOR.Incomplete : null;
        return (
          <View
            style={{
              backgroundColor: brand.white,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: brand.line,
              padding: 14,
              marginBottom: 10,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={{ fontWeight: "800", color: brand.ink, fontSize: 16 }} numberOfLines={1}>
                {item.firstName} {item.lastName}
              </Text>
              <Text style={{ color: brand.inkMuted, fontSize: 13, marginTop: 2 }} numberOfLines={1}>
                {item.role} · {STATUS_LABEL[item.status] ?? item.status}
              </Text>
            </View>
            {fit && (
              <View style={{ backgroundColor: fit.bg, borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 5 }}>
                <Text style={{ color: fit.fg, fontWeight: "700", fontSize: 12 }}>{item.fit}</Text>
              </View>
            )}
          </View>
        );
      }}
    />
  );
}
