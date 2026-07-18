import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { apiGet, apiSend } from "@/lib/api";
import { brand, tone, feedback } from "@/theme";

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
  decisionNotes: string | null;
  decisionReasonOptions: string[];
  decisionAt: string | null;
  interviewTypes: { id: string; name: string; durationMinutes: number }[];
  senderHasAvailability: boolean;
  gateFindings: { label: string; gate: "flag" | "knockout" | "legal"; expected: string; answer: string }[];
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
  High: tone.success,
  Mid: tone.warning,
  Low: tone.danger,
};
const OVERALL_TONE: Record<string, { bg: string; fg: string }> = {
  "Strong fit": tone.successSolid,
  Consider: tone.success,
  Caution: tone.warning,
  "Not recommended": tone.dangerSolid,
};

const DECISIONS = [
  { value: "hired", label: "Hired" },
  { value: "not_hired", label: "Interviewed — not hired" },
  { value: "declined", label: "Declined to interview" },
] as const;

/** Plain-language takeaway per overall fit — the one thing a busy operator reads. */
const VERDICT: Record<string, string> = {
  "Strong fit": "Strong fit — a promising candidate. Worth an interview.",
  Consider: "Worth a look — some real strengths, a few gaps.",
  Caution: "Some concerns — review carefully before you interview.",
  "Not recommended": "Weak fit on this assessment.",
};

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
  const [notes, setNotes] = useState("");
  const [addingReason, setAddingReason] = useState(false);
  const [newReason, setNewReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await apiGet<{ candidate: Detail }>(`/api/mobile/candidates/${id}`);
      setDetail(data.candidate);
      setDecision(data.candidate.decision);
      setReason(data.candidate.decisionReason ?? "");
      setNotes(data.candidate.decisionNotes ?? "");
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
    async (
      nextDecision?: string | null,
      nextReason?: string,
      nextNotes?: string
    ) => {
      const d = nextDecision !== undefined ? nextDecision : decision;
      const r = nextReason !== undefined ? nextReason : reason;
      const n = nextNotes !== undefined ? nextNotes : notes;
      setSaving(true);
      try {
        await apiSend("PATCH", `/api/mobile/candidates/${id}`, {
          decision: d,
          reason: r,
          notes: n,
        });
        setDecision(d);
        await load();
      } catch (e) {
        Alert.alert("Couldn't save", e instanceof Error ? e.message : "Try again.");
      } finally {
        setSaving(false);
      }
    },
    [id, decision, reason, notes, load]
  );

  if (!detail) {
    return (
      <View style={{ flex: 1, backgroundColor: brand.cream, alignItems: "center", justifyContent: "center" }}>
        {error ? (
          <Text style={{ color: brand.inkMuted, padding: 24, textAlign: "center" }}>{error}</Text>
        ) : (
          <ActivityIndicator color={brand.blue} size="large" />
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
        <Card style={{ borderColor: feedback.warnBorder, borderWidth: 2, backgroundColor: feedback.warnSurface }}>
          <Text style={{ fontWeight: "800", color: feedback.warnText }}>⚠️ Score unreliable</Text>
          <Text style={{ color: feedback.warnText, fontSize: 13, marginTop: 4 }}>
            Answers weren&apos;t careful — don&apos;t reject on the fit below. Consider an interview or a retake.
          </Text>
        </Card>
      )}

      {/* Custom-question gate findings */}
      {detail.gateFindings.map((f, i) => {
        const legal = f.gate === "legal";
        const knockout = f.gate === "knockout";
        const border = legal ? feedback.dangerSolid : knockout ? feedback.warnBorder : brand.line;
        const bg = legal ? "#fef2f2" : knockout ? feedback.warnSurface : brand.cream;
        const fg = legal ? feedback.dangerText : knockout ? feedback.warnText : brand.ink;
        const heading = legal
          ? "⚠️ Legal requirement not met"
          : knockout
            ? "Requirement not met"
            : "Flagged for review";
        return (
          <Card key={i} style={{ borderColor: border, borderWidth: 2, backgroundColor: bg }}>
            <Text style={{ fontWeight: "800", color: fg }}>{heading}</Text>
            <Text style={{ color: fg, fontSize: 13, marginTop: 4 }}>
              {f.label} — answered &ldquo;{f.answer}&rdquo; (needs &ldquo;{f.expected}&rdquo;)
            </Text>
          </Card>
        );
      })}

      {/* Report card */}
      {r ? (
        <Card>
          {/* The takeaway, front and center */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Pill bg={(OVERALL_TONE[r.overall] ?? BAND_TONE.Mid).bg} fg={(OVERALL_TONE[r.overall] ?? BAND_TONE.Mid).fg}>
              {r.overall}
            </Pill>
            <Text style={{ fontSize: 16, color: brand.amber }}>
              {"★".repeat(r.stars)}
              <Text style={{ color: brand.line }}>{"★".repeat(5 - r.stars)}</Text>
            </Text>
          </View>
          <Text style={{ fontSize: 16, fontWeight: "700", color: brand.ink, marginTop: 10, lineHeight: 22 }}>
            {VERDICT[r.overall] ?? r.overall}
          </Text>

          {/* Plain-language signals worth seeing at a glance */}
          {r.screener.length > 0 && (
            <View style={{ marginTop: 12, gap: 3 }}>
              {r.screener.map((f, i) => (
                <Text
                  key={i}
                  style={{
                    fontSize: 13,
                    color:
                      f.tone === "positive" ? feedback.positiveText : f.tone === "concern" ? feedback.dangerText : brand.inkMuted,
                  }}
                >
                  {f.tone === "positive" ? "✓ " : f.tone === "concern" ? "⚠ " : "• "}
                  {f.label}
                </Text>
              ))}
            </View>
          )}

          {/* The detailed band-by-band breakdown, hidden until asked for */}
          <Pressable onPress={() => setShowDetails((v) => !v)} style={{ marginTop: 14 }}>
            <Text style={{ color: brand.blueDeep, fontWeight: "700", fontSize: 14 }}>
              {showDetails ? "Hide the full breakdown ▲" : "Show the full breakdown ▾"}
            </Text>
          </Pressable>

          {showDetails && (
            <>
              <View style={{ marginTop: 12, gap: 10 }}>
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

              <Text style={{ marginTop: 14, fontSize: 11, color: brand.inkMuted }}>
                Bands use raw anchors (pre-pilot). Recommendations are decision support — you make the call.
              </Text>
            </>
          )}
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

      {/* Invite to interview */}
      <InviteSection
        id={detail.id}
        types={detail.interviewTypes}
        hasEmail={!!detail.email}
        canInvite={detail.senderHasAvailability}
      />

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
                  borderColor: active ? brand.blue : brand.line,
                  backgroundColor: active ? brand.soft : brand.white,
                  borderRadius: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ fontWeight: "700", color: active ? brand.blueDeep : brand.ink }}>{d.label}</Text>
                {active && <Text style={{ color: brand.blueDeep, fontWeight: "800" }}>✓</Text>}
              </Pressable>
            );
          })}
        </View>

        <Text style={{ fontSize: 12, color: brand.inkMuted, marginTop: 14, marginBottom: 6 }}>
          Reason (optional)
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {detail.decisionReasonOptions.map((r) => {
            const active = reason === r;
            return (
              <Pressable
                key={r}
                disabled={saving}
                onPress={() => {
                  const next = active ? "" : r;
                  setReason(next);
                  if (decision) save(decision, next);
                }}
                style={{
                  borderWidth: 1.5,
                  borderColor: active ? brand.blue : brand.line,
                  backgroundColor: active ? brand.soft : brand.white,
                  borderRadius: 999,
                  paddingVertical: 7,
                  paddingHorizontal: 12,
                }}
              >
                <Text style={{ fontWeight: "600", fontSize: 13, color: active ? brand.blueDeep : brand.ink }}>
                  {r}
                </Text>
              </Pressable>
            );
          })}
          {!addingReason && (
            <Pressable
              disabled={saving}
              onPress={() => setAddingReason(true)}
              style={{
                borderWidth: 1.5,
                borderColor: brand.line,
                borderRadius: 999,
                paddingVertical: 7,
                paddingHorizontal: 12,
              }}
            >
              <Text style={{ fontWeight: "600", fontSize: 13, color: brand.blueDeep }}>＋ Add reason</Text>
            </Pressable>
          )}
        </View>
        {addingReason && (
          <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
            <TextInput
              value={newReason}
              onChangeText={setNewReason}
              autoFocus
              placeholder="Type a new reason"
              placeholderTextColor={brand.inkMuted}
              onSubmitEditing={() => {
                const r = newReason.trim();
                if (!r) return;
                setReason(r);
                setAddingReason(false);
                setNewReason("");
                if (decision) save(decision, r);
              }}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: brand.line,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: brand.ink,
                backgroundColor: brand.white,
              }}
            />
            <Pressable
              onPress={() => {
                setAddingReason(false);
                setNewReason("");
              }}
              style={{ justifyContent: "center", paddingHorizontal: 6 }}
            >
              <Text style={{ color: brand.inkMuted, fontWeight: "600" }}>Cancel</Text>
            </Pressable>
          </View>
        )}

        <Text style={{ fontSize: 12, color: brand.inkMuted, marginTop: 14, marginBottom: 4 }}>
          Notes (optional)
        </Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          onBlur={() => {
            if (decision) save(decision, reason, notes);
          }}
          placeholder="Anything worth remembering for the record"
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
            <Text style={{ color: brand.blueDeep, fontWeight: "600" }}>Clear decision</Text>
          </Pressable>
        )}
        {saving && (
          <View style={{ marginTop: 10, flexDirection: "row", alignItems: "center", gap: 8 }}>
            <ActivityIndicator color={brand.blue} />
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

function InviteSection({
  id,
  types,
  hasEmail,
  canInvite,
}: {
  id: string;
  types: { id: string; name: string; durationMinutes: number }[];
  hasEmail: boolean;
  canInvite: boolean;
}) {
  const [typeId, setTypeId] = useState(types[0]?.id ?? "");
  const [url, setUrl] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const invite = useCallback(
    async (email: boolean) => {
      setErr(null);
      setSentTo(null);
      setBusy(true);
      try {
        const res = await apiSend<{ url: string; sentTo: string | null }>(
          "POST",
          `/api/mobile/candidates/${id}/invite`,
          { templateId: typeId, email }
        );
        setUrl(res.url);
        setSentTo(res.sentTo);
        if (email && res.sentTo) {
          Alert.alert("Sent", `Invitation emailed to ${res.sentTo}. They can book from the email.`);
        }
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Could not create the invite.");
      } finally {
        setBusy(false);
      }
    },
    [id, typeId]
  );

  if (types.length === 0 || !canInvite) {
    return (
      <Card>
        <Text style={{ fontWeight: "800", color: brand.ink, fontSize: 16 }}>Invite to interview</Text>
        <Text style={{ color: brand.inkMuted, fontSize: 13, marginTop: 6 }}>
          {types.length === 0
            ? "First, create an interview type on your Calendar page on the web, then come back to invite."
            : "Set up your interview availability on the Calendar page (web) first — candidates book against your calendar, so it needs open times."}
        </Text>
      </Card>
    );
  }

  return (
    <Card>
      <Text style={{ fontWeight: "800", color: brand.ink, fontSize: 16 }}>Invite to interview</Text>
      <Text style={{ color: brand.inkMuted, fontSize: 13, marginTop: 2 }}>
        Send a link the candidate uses to book a time from your open slots.
      </Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
        {types.map((t) => {
          const active = t.id === typeId;
          return (
            <Pressable
              key={t.id}
              onPress={() => setTypeId(t.id)}
              style={{
                borderWidth: 1.5,
                borderColor: active ? brand.blue : brand.line,
                backgroundColor: active ? brand.soft : brand.white,
                borderRadius: 9999,
                paddingHorizontal: 14,
                paddingVertical: 8,
              }}
            >
              <Text style={{ color: active ? brand.blueDeep : brand.ink, fontWeight: active ? "700" : "500", fontSize: 13 }}>
                {t.name} · {t.durationMinutes} min
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        disabled={busy || !hasEmail}
        onPress={() => invite(true)}
        style={{
          marginTop: 14,
          backgroundColor: brand.blue,
          borderRadius: 12,
          paddingVertical: 13,
          alignItems: "center",
          opacity: busy || !hasEmail ? 0.4 : 1,
        }}
      >
        <Text style={{ color: brand.white, fontWeight: "800", fontSize: 15 }}>
          {busy ? "Working…" : "Email to candidate"}
        </Text>
      </Pressable>
      {!hasEmail && (
        <Text style={{ color: brand.inkMuted, fontSize: 12, marginTop: 6, textAlign: "center" }}>
          No email on file — get a link to share by text instead.
        </Text>
      )}

      <Pressable disabled={busy} onPress={() => invite(false)} style={{ marginTop: 12, alignItems: "center" }}>
        <Text style={{ color: brand.blueDeep, fontWeight: "700", fontSize: 14 }}>
          {url ? "New link" : "Get a link to share instead"}
        </Text>
      </Pressable>

      {err && <Text style={{ color: feedback.dangerText, fontSize: 13, marginTop: 10 }}>{err}</Text>}
      {sentTo && (
        <Text style={{ color: feedback.positiveText, fontSize: 13, marginTop: 10 }}>
          ✓ Emailed to {sentTo} (from your store).
        </Text>
      )}

      {url && (
        <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: brand.line, paddingTop: 12 }}>
          <Text style={{ fontFamily: "monospace", fontSize: 12, color: brand.ink }} numberOfLines={1}>
            {url}
          </Text>
          <View style={{ flexDirection: "row", gap: 18, marginTop: 8 }}>
            <Pressable onPress={() => Share.share({ message: url, url, title: "Interview booking link" })}>
              <Text style={{ color: brand.blueDeep, fontWeight: "700", fontSize: 14 }}>Share</Text>
            </Pressable>
            <Pressable onPress={() => WebBrowser.openBrowserAsync(url)}>
              <Text style={{ color: brand.blueDeep, fontWeight: "700", fontSize: 14 }}>Open</Text>
            </Pressable>
          </View>
          <Text style={{ color: brand.inkMuted, fontSize: 11, marginTop: 6 }}>
            Expires in 14 days and works once.
          </Text>
        </View>
      )}
    </Card>
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
