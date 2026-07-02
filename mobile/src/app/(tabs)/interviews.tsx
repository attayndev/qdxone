import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Share,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { apiGet, apiSend } from "@/lib/api";
import { brand, feedback } from "@/theme";

type MeetingType = "in_person" | "phone" | "google_meet" | "teams";

interface Interview {
  id: string;
  applicationId: string;
  candidateName: string;
  interviewName: string;
  startAt: string;
  timezone: string;
  meetingType: MeetingType;
  meetingLocation: string | null;
  conferenceUrl: string | null;
  status: string;
  scheduledBy: string | null;
}

const MEETING_LABEL: Record<MeetingType, string> = {
  in_person: "In person",
  phone: "Phone",
  google_meet: "Google Meet",
  teams: "Microsoft Teams",
};

/** "Tue, Jul 7 · 2:30 PM" in the booking's own timezone (best-effort). */
function formatWhen(iso: string, timeZone: string): string {
  const d = new Date(iso);
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone,
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

export default function Interviews() {
  const [interviews, setInterviews] = useState<Interview[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await apiGet<{ interviews: Interview[] }>("/api/mobile/interviews");
      setInterviews(data.interviews);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load interviews");
      setInterviews([]);
    }
  }, []);

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

  if (interviews === null) {
    return (
      <View style={{ flex: 1, backgroundColor: brand.cream, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={brand.blue} size="large" />
      </View>
    );
  }

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: brand.cream }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      data={interviews}
      keyExtractor={(i) => i.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={brand.blue} />}
      ListEmptyComponent={
        <View style={{ padding: 24, alignItems: "center" }}>
          <Text style={{ fontSize: 40 }}>📅</Text>
          <Text style={{ marginTop: 8, color: brand.inkMuted, textAlign: "center" }}>
            {error
              ? error
              : "Nothing booked yet. Invite a candidate from their profile and confirmed times show up here."}
          </Text>
        </View>
      }
      renderItem={({ item }) => <InterviewCard interview={item} onChanged={load} />}
    />
  );
}

function InterviewCard({ interview, onChanged }: { interview: Interview; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const join = interview.conferenceUrl;

  const cancel = useCallback(() => {
    Alert.alert(
      "Cancel interview?",
      `This frees the slot and lets ${interview.candidateName} know it's off.`,
      [
        { text: "Keep it", style: "cancel" },
        {
          text: "Cancel interview",
          style: "destructive",
          onPress: async () => {
            setBusy(true);
            try {
              await apiSend("DELETE", `/api/mobile/interviews/${interview.id}`);
              onChanged();
            } catch (e) {
              Alert.alert("Couldn't cancel", e instanceof Error ? e.message : "Try again.");
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  }, [interview.id, interview.candidateName, onChanged]);

  return (
    <View
      style={{
        backgroundColor: brand.white,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: brand.line,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <Text style={{ fontWeight: "800", fontSize: 16, color: brand.ink }}>
        {formatWhen(interview.startAt, interview.timezone)}
      </Text>
      <Pressable onPress={() => router.push(`/candidate/${interview.applicationId}`)} style={{ marginTop: 4 }}>
        <Text style={{ fontSize: 15, color: brand.blueDeep, fontWeight: "700" }}>
          {interview.candidateName}
        </Text>
      </Pressable>
      <Text style={{ color: brand.inkMuted, fontSize: 13, marginTop: 2 }}>
        {interview.interviewName} · {MEETING_LABEL[interview.meetingType] ?? interview.meetingType}
      </Text>
      {interview.meetingType === "in_person" && interview.meetingLocation ? (
        <Text style={{ color: brand.inkMuted, fontSize: 13, marginTop: 2 }}>📍 {interview.meetingLocation}</Text>
      ) : null}
      {interview.scheduledBy ? (
        <Text style={{ color: brand.inkMuted, fontSize: 12, marginTop: 2 }}>Scheduled by {interview.scheduledBy}</Text>
      ) : null}

      <View style={{ flexDirection: "row", gap: 18, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
        {join ? (
          <Pressable onPress={() => WebBrowser.openBrowserAsync(join)}>
            <Text style={{ color: brand.blueDeep, fontWeight: "700", fontSize: 14 }}>Join</Text>
          </Pressable>
        ) : null}
        {join ? (
          <Pressable onPress={() => Share.share({ message: join, url: join, title: "Interview link" })}>
            <Text style={{ color: brand.blueDeep, fontWeight: "700", fontSize: 14 }}>Share link</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={cancel} disabled={busy} style={{ opacity: busy ? 0.4 : 1 }}>
          <Text style={{ color: feedback.dangerSolid, fontWeight: "700", fontSize: 14 }}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}
