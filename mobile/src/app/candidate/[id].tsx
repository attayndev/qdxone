import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { apiGet, apiSend } from "@/lib/api";
import { brand } from "@/theme";

type Band = "Low" | "Mid" | "High";

interface Detail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
  submittedAt: string;
  assessmentStatus: string | null;
  decision: string | null;
  decisionReason: string | null;
  decisionAt: string | null;
  report: {
    overall: string;
    stars: number;
    categories: {
      categoryUi: string;
      band: Band;
      crew: string | null;
      facets: { facet: string; band: Band }[];
    }[];
    attitude: { band: Band } | null;
    screener: { label: string; tone: "positive" | "neutral" | "concern" }[];
    unreliable: boolean;
    flags: string[];
  } | null;
  application: {
    eligibleToWork: boolean | null;
    postalCode: string | null;
    earliestStart: string | null;
    availability: { day: string; blocks: string[] }[];
    workHistory: { employer: string; role: string; span: string | null }[];
    references: { name: string; contact: string }[];
    customAnswers: { label: string; value: string }[];
  };
}

const BAND_TONE: Record<Band, { bg: string; fg: string }> = {
  High: { bg: "#dcfce7", fg: "#166534" },
  Mid: { bg: "#fef3c7", fg: brand.amber },
  Low: { bg: "#fee2e2", fg: "#b91c1c" },
};
const OVERALL_TONE: Record<string, { bg: string; fg: string }> = {
  "Strong fit": { bg: brand.green, fg: brand.white },
  Consider: { bg: "#dcfce7", fg: "#14532d" },
  Caution: { bg: "#fef3c7", fg: "#78350f" },
  "Not recommended": { bg: "#dc2626", fg: brand.white },
};

const DECISIONS = [
  { value: "hired", label: "Hired" },
  { value: "not_hired", label: "Interviewed — not hired" },
  { value: "declined", label: "Declined to interview" },
] as const;

const DAY_LABEL: Record<string, string> = {
  mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun",
};
const BLOCK_LABEL: Record<string, string> = {
  morning: "AM", afternoon: "Mid", evening: "PM",
};

export default function CandidateDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [decision, setDecision] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await apiGet<{ candidate: Detail }>(`/api/mobile/candidates/${id}`);
      setDetail(data.candidate);
      setDecision(data.candidate.decision);
      setReason(data.candidate.decisionReason ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load candidate");
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const save = useCallback(
    async (next: string | null) => {
      setSaving(true);
      try {
        await apiSend("PATCH", `/api/mobile/candidates/${id}`, { decision: next, reason });
        setDecision(next);
        await load();
      } catch (e) {
        Alert.alert("Couldn't save", e instanceof Error ? e.message : "Try again.");
      } finally {
        setSaving(false);
      }
    },
    [id, reason, load]
  );

  if (!detail) {
    return (
      <View style={{ flex: 1, backgroundColor: brand.cream, alignItems: "center", justifyContent: "center" }}>
        {error ? (
          <Text style={{ color: brand.inkMuted, padding: 24, textAlign: "center" }}>{error}</Text>
        ) : (
          <ActivityIndicator color={brand.pink} size="large" />
        )}
      </View>
    );
  }

  const r = detail.report;
  const a = detail.application;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: brand.cream }} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <Text style={{ fontSize: 26, fontWeight: "900", color: brand.ink }}>
        {detail.firstName} {detail.lastName}
      </Text>
      <Text style={{ color: brand.inkMuted, marginTop: 2 }}>
        {detail.role} · {detail.email}
        {detail.phone ? ` · ${detail.phone}` : ""}
      </Text>
      <Text style={{ color: brand.inkMuted, fontSize: 12, marginTop: 2 }}>
        Applied {new Date(detail.submittedAt).toLocaleDateString()}
        {detail.assessmentStatus ? ` · Assessment: ${detail.assessmentStatus}` : " · No assessment"}
      </Text>

      {/* Reliability warning */}
      {r?.unreliable && (
        <Card style={{ borderColor: "#f59e0b", borderWidth: 2, backgroundColor: "#fffbeb" }}>
          <Text style={{ fontWeight: "800", color: "#78350f" }}>⚠️ Score unreliable</Text>
          <Text style={{ color: "#78350f", fontSize: 13, marginTop: 4 }}>
            Answers weren&apos;t careful — don&apos;t reject on the fit below. Consider an interview or a retake.
          </Text>
        </Card>
      )}

      {/* Report card */}
      {r ? (
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Pill bg={(OVERALL_TONE[r.overall] ?? BAND_TONE.Mid).bg} fg={(OVERALL_TONE[r.overall] ?? BAND_TONE.Mid).fg}>
                {r.overall}
              </Pill>
              <Text style={{ fontSize: 16, color: brand.amber }}>
                {"★".repeat(r.stars)}
                <Text style={{ color: brand.line }}>{"★".repeat(5 - r.stars)}</Text>
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 14, gap: 10 }}>
            {r.categories.map((c) => (
              <View key={c.categoryUi} style={{ borderWidth: 1, borderColor: brand.line, borderRadius: 12, padding: 12 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontWeight: "800", color: brand.ink }}>{c.categoryUi}</Text>
                  <Pill bg={BAND_TONE[c.band].bg} fg={BAND_TONE[c.band].fg}>{c.band}</Pill>
                </View>
                {c.crew && (
                  <Text style={{ fontSize: 12, color: brand.inkMuted, marginTop: 3 }}>{c.crew}</Text>
                )}
                <View style={{ marginTop: 8, gap: 4 }}>
                  {c.facets.map((f) => (
                    <View key={f.facet} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={{ fontSize: 13, color: brand.inkMuted }}>{f.facet}</Text>
                      <Pill bg={BAND_TONE[f.band].bg} fg={BAND_TONE[f.band].fg}>{f.band}</Pill>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>

          {r.attitude && (
            <View style={{ marginTop: 12, flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ fontWeight: "800", color: brand.ink }}>Attitude</Text>
              <Pill bg={BAND_TONE[r.attitude.band].bg} fg={BAND_TONE[r.attitude.band].fg}>{r.attitude.band}</Pill>
              <Text style={{ fontSize: 11, color: brand.inkMuted }}>coachability + warmth + cooperation</Text>
            </View>
          )}

          {r.screener.length > 0 && (
            <View style={{ marginTop: 14 }}>
              <Text style={{ fontWeight: "800", color: brand.ink, fontSize: 13 }}>Screener</Text>
              <View style={{ marginTop: 4, gap: 3 }}>
                {r.screener.map((f, i) => (
                  <Text
                    key={i}
                    style={{
                      fontSize: 13,
                      color:
                        f.tone === "positive" ? "#15803d" : f.tone === "concern" ? "#b91c1c" : brand.inkMuted,
                    }}
                  >
                    {f.tone === "positive" ? "✓ " : f.tone === "concern" ? "⚠ " : "• "}
                    {f.label}
                  </Text>
                ))}
              </View>
            </View>
          )}

          <Text style={{ marginTop: 14, fontSize: 11, color: brand.inkMuted }}>
            Bands use raw anchors (pre-pilot). Recommendations are decision support — you make the call.
          </Text>
        </Card>
      ) : (
        <Card>
          <Text style={{ color: brand.inkMuted }}>
            {detail.assessmentStatus
              ? "Assessment in progress — the full report appears once it's complete."
              : "No assessment yet."}
          </Text>
        </Card>
      )}

      {/* Decision */}
      <Card>
        <Text style={{ fontWeight: "800", color: brand.ink, fontSize: 16 }}>Decision</Text>
        {detail.decisionAt && (
          <Text style={{ fontSize: 12, color: brand.inkMuted, marginTop: 2 }}>
            Recorded {new Date(detail.decisionAt).toLocaleDateString()}
          </Text>
        )}
        <View style={{ marginTop: 10, gap: 8 }}>
          {DECISIONS.map((d) => {
            const active = decision === d.value;
            return (
              <Pressable
                key={d.value}
                disabled={saving}
                onPress={() => save(d.value)}
                style={{
                  borderWidth: 1.5,
                  borderColor: active ? brand.pink : brand.line,
                  backgroundColor: active ? brand.pink50 : brand.white,
                  borderRadius: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ fontWeight: "700", color: active ? brand.pink600 : brand.ink }}>{d.label}</Text>
                {active && <Text style={{ color: brand.pink600, fontWeight: "800" }}>✓</Text>}
              </Pressable>
            );
          })}
        </View>

        <Text style={{ fontSize: 12, color: brand.inkMuted, marginTop: 14, marginBottom: 4 }}>
          Reason (optional)
        </Text>
        <TextInput
          value={reason}
          onChangeText={setReason}
          placeholder="Add a note for the record"
          placeholderTextColor={brand.inkMuted}
          multiline
          style={{
            borderWidth: 1,
            borderColor: brand.line,
            borderRadius: 12,
            padding: 12,
            minHeight: 64,
            color: brand.ink,
            backgroundColor: brand.white,
            textAlignVertical: "top",
          }}
        />

        {decision && (
          <Pressable disabled={saving} onPress={() => save(null)} style={{ marginTop: 12, alignSelf: "flex-start" }}>
            <Text style={{ color: brand.pink600, fontWeight: "600" }}>Clear decision</Text>
          </Pressable>
        )}
        {saving && (
          <View style={{ marginTop: 10, flexDirection: "row", alignItems: "center", gap: 8 }}>
            <ActivityIndicator color={brand.pink} />
            <Text style={{ color: brand.inkMuted, fontSize: 13 }}>Saving…</Text>
          </View>
        )}
      </Card>

      {/* Application */}
      <Card>
        <Text style={{ fontWeight: "800", color: brand.ink, fontSize: 16 }}>Application</Text>
        <Row label="Eligible to work in US" value={a.eligibleToWork == null ? "—" : a.eligibleToWork ? "Yes" : "No"} />
        <Row label="ZIP" value={a.postalCode ?? "—"} />
        <Row label="Earliest start" value={a.earliestStart ?? "—"} />

        <Section title="Availability">
          {a.availability.length === 0 ? (
            <Muted>Not provided.</Muted>
          ) : (
            a.availability.map((d) => (
              <Text key={d.day} style={{ fontSize: 13, color: brand.ink }}>
                <Text style={{ fontWeight: "700" }}>{DAY_LABEL[d.day] ?? d.day}:</Text>{" "}
                {d.blocks.map((b) => BLOCK_LABEL[b] ?? b).join(", ")}
              </Text>
            ))
          )}
        </Section>

        <Section title="Recent jobs">
          {a.workHistory.length === 0 ? (
            <Muted>None listed.</Muted>
          ) : (
            a.workHistory.map((j, i) => (
              <Text key={i} style={{ fontSize: 13, color: brand.ink }}>
                {[j.role, j.employer, j.span].filter(Boolean).join(" · ")}
              </Text>
            ))
          )}
        </Section>

        <Section title="References">
          {a.references.length === 0 ? (
            <Muted>None listed.</Muted>
          ) : (
            a.references.map((ref, i) => (
              <Text key={i} style={{ fontSize: 13, color: brand.ink }}>
                {[ref.name, ref.contact].filter(Boolean).join(" · ")}
              </Text>
            ))
          )}
        </Section>

        {a.customAnswers.length > 0 && (
          <Section title="More questions">
            {a.customAnswers.map((c, i) => (
              <Text key={i} style={{ fontSize: 13, color: brand.ink }}>
                <Text style={{ color: brand.inkMuted }}>{c.label}:</Text> {c.value}
              </Text>
            ))}
          </Section>
        )}
      </Card>
    </ScrollView>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <View
      style={[
        {
          backgroundColor: brand.white,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: brand.line,
          padding: 16,
          marginTop: 14,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

function Pill({ children, bg, fg }: { children: React.ReactNode; bg: string; fg: string }) {
  return (
    <View style={{ backgroundColor: bg, borderRadius: 9999, paddingHorizontal: 11, paddingVertical: 4 }}>
      <Text style={{ color: fg, fontWeight: "800", fontSize: 12 }}>{children}</Text>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
      <Text style={{ color: brand.inkMuted, fontSize: 13 }}>{label}</Text>
      <Text style={{ fontWeight: "700", color: brand.ink, fontSize: 13 }}>{value}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={{ fontWeight: "800", color: brand.ink, marginBottom: 4 }}>{title}</Text>
      <View style={{ gap: 3 }}>{children}</View>
    </View>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <Text style={{ fontSize: 13, color: brand.inkMuted }}>{children}</Text>;
}
