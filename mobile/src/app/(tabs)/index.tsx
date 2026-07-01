import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useAuth } from "@/lib/auth";
import { apiGet } from "@/lib/api";
import { brand, tone } from "@/theme";
import {
  CANDIDATE_VIEWS,
  matchesSearch,
  matchesView,
  type CandidateView,
} from "@/lib/candidateFilter";

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
  "Strong fit": tone.success,
  Consider: tone.info,
  Caution: tone.warning,
  "Not recommended": tone.danger,
  Incomplete: tone.neutral,
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
  const [view, setView] = useState<CandidateView>("active");
  const [q, setQ] = useState("");

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

  // Reload on focus so a decision recorded on the detail screen shows here.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const filtered = useMemo(
    () => (candidates ?? []).filter((c) => matchesView(c, view) && matchesSearch(c, q)),
    [candidates, view, q]
  );

  if (candidates === null) {
    return (
      <View style={{ flex: 1, backgroundColor: brand.cream, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={brand.blue} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: brand.cream }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12, gap: 10 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: brand.inkMuted, fontSize: 13 }} numberOfLines={1}>
            {session?.user.email}
          </Text>
          <Pressable onPress={signOut}>
            <Text style={{ color: brand.blueDeep, fontWeight: "600", fontSize: 13 }}>Sign out</Text>
          </Pressable>
        </View>

        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search by name, email, or role"
          placeholderTextColor={brand.inkMuted}
          autoCapitalize="none"
          autoCorrect={false}
          style={{
            borderWidth: 1,
            borderColor: brand.line,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 10,
            backgroundColor: brand.white,
            color: brand.ink,
            fontSize: 15,
          }}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 2 }}
        >
          {CANDIDATE_VIEWS.map((v) => {
            const active = v.key === view;
            return (
              <Pressable
                key={v.key}
                onPress={() => setView(v.key)}
                style={{
                  borderWidth: 1.5,
                  borderColor: active ? brand.blue : brand.line,
                  backgroundColor: active ? brand.blue : brand.white,
                  borderRadius: 9999,
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                }}
              >
                <Text style={{ color: active ? brand.white : brand.ink, fontWeight: "700", fontSize: 13 }}>
                  {v.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        data={filtered}
        keyExtractor={(c) => c.id}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={brand.blue} />}
        ListEmptyComponent={
          <View style={{ padding: 24, alignItems: "center" }}>
            <Text style={{ fontSize: 40 }}>🗂️</Text>
            <Text style={{ marginTop: 8, color: brand.inkMuted, textAlign: "center" }}>
              {error
                ? error
                : candidates.length === 0
                  ? "No applicants yet. Share a posting's link or QR to start collecting candidates."
                  : "No candidates match this filter."}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const fit = item.fit ? FIT_COLOR[item.fit] ?? FIT_COLOR.Incomplete : null;
          return (
            <Pressable
              onPress={() => router.push(`/candidate/${item.id}`)}
              style={({ pressed }) => ({
                backgroundColor: brand.white,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: brand.line,
                padding: 14,
                marginBottom: 10,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                opacity: pressed ? 0.6 : 1,
              })}
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
            </Pressable>
          );
        }}
      />
    </View>
  );
}
