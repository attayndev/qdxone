import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { apiGet, apiSend } from "@/lib/api";
import { brand, tone, feedback } from "@/theme";

type PayPeriod = "hour" | "year";

interface Posting {
  id: string;
  title: string;
  status: "draft" | "open" | "closed";
  url: string;
  location: string | null;
  payMin: number | null;
  payMax: number | null;
  payPeriod: PayPeriod;
  tips: boolean;
}

interface Screen {
  roles: string[];
  locations: { id: string; name: string }[];
  hasLocation: boolean;
  careersUrl: string;
  postings: Posting[];
}

const STATUS_TONE: Record<string, { bg: string; fg: string }> = {
  open: tone.success,
  closed: tone.neutral,
  draft: tone.info,
};

/** Mirror of web src/lib/pay.formatPay — "$16–$18 / hour + tips". */
function formatPay(p: { min: number | null; max: number | null; period: PayPeriod; tips: boolean }): string | null {
  if (p.min == null || p.max == null) return null;
  const money = (n: number) =>
    p.period === "year" ? `$${Math.round(n).toLocaleString("en-US")}` : `$${n.toFixed(2).replace(/\.00$/, "")}`;
  const range = p.min === p.max ? money(p.min) : `${money(p.min)}–${money(p.max)}`;
  return `${range} / ${p.period}${p.tips ? " + tips" : ""}`;
}

export default function PostJob() {
  const [screen, setScreen] = useState<Screen | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setScreen(await apiGet<Screen>("/api/mobile/postings"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load postings");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!screen) {
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

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: brand.cream }}
      contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
    >
      <ShareCard title="Your careers page" url={screen.careersUrl} subtitle="One link for all your open roles." />

      <CreateForm screen={screen} onCreated={load} />

      <Text style={{ fontWeight: "900", fontSize: 18, color: brand.ink, marginTop: 22, marginBottom: 4 }}>
        Your postings
      </Text>
      {screen.postings.length === 0 ? (
        <Text style={{ color: brand.inkMuted, fontSize: 14 }}>
          No postings yet. Create one to get a shareable link.
        </Text>
      ) : (
        screen.postings.map((p) => <PostingCard key={p.id} posting={p} onChanged={load} />)
      )}
    </ScrollView>
  );
}

function CreateForm({ screen, onCreated }: { screen: Screen; onCreated: () => void }) {
  const [title, setTitle] = useState(screen.roles[0] ?? "");
  const [locationId, setLocationId] = useState(screen.locations[0]?.id ?? "");
  const [payMin, setPayMin] = useState("");
  const [payMax, setPayMax] = useState("");
  const [period, setPeriod] = useState<PayPeriod>("hour");
  const [tips, setTips] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = useCallback(async () => {
    setErr(null);
    setSaving(true);
    try {
      await apiSend("POST", "/api/mobile/postings", {
        title,
        location_id: screen.locations.length > 1 ? locationId : "",
        pay_min: payMin,
        pay_max: payMax,
        pay_period: period,
        tips,
      });
      setPayMin("");
      setPayMax("");
      setTips(false);
      onCreated();
      Alert.alert("Posted", "Your job is live — share the link to start collecting applicants.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not create the posting");
    } finally {
      setSaving(false);
    }
  }, [title, locationId, payMin, payMax, period, tips, screen.locations.length, onCreated]);

  if (!screen.hasLocation) {
    return (
      <Card>
        <Text style={{ fontWeight: "800", fontSize: 16, color: brand.ink }}>New posting</Text>
        <Text style={{ color: brand.blueDeep, marginTop: 8, fontSize: 14 }}>
          Set up your store profile on the web first, then come back to post.
        </Text>
      </Card>
    );
  }

  return (
    <Card>
      <Text style={{ fontWeight: "800", fontSize: 16, color: brand.ink }}>New posting</Text>

      <Label>Role</Label>
      <ChipRow
        options={screen.roles.map((r) => ({ key: r, label: r }))}
        value={title}
        onChange={setTitle}
      />

      {screen.locations.length > 1 && (
        <>
          <Label>Store</Label>
          <ChipRow
            options={screen.locations.map((l) => ({ key: l.id, label: l.name }))}
            value={locationId}
            onChange={setLocationId}
          />
        </>
      )}

      <Label>Pay range</Label>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <PayInput value={payMin} onChange={setPayMin} placeholder="Min" />
        <Text style={{ color: brand.inkMuted }}>to</Text>
        <PayInput value={payMax} onChange={setPayMax} placeholder="Max" />
        <ChipRow
          options={[
            { key: "hour", label: "/ hour" },
            { key: "year", label: "/ year" },
          ]}
          value={period}
          onChange={(v) => setPeriod(v as PayPeriod)}
          style={{ marginTop: 0, marginBottom: 0 }}
        />
      </View>
      <Text style={{ fontSize: 12, color: brand.inkMuted, marginTop: 6 }}>
        Required: NY and several states require a good-faith pay range on every job ad.
      </Text>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12 }}>
        <Switch
          value={tips}
          onValueChange={setTips}
          trackColor={{ true: brand.blue, false: brand.line }}
          thumbColor={brand.white}
        />
        <Text style={{ color: brand.ink, fontSize: 14 }}>This role earns tips (shows “+ tips”)</Text>
      </View>

      {err && <Text style={{ color: feedback.dangerText, marginTop: 10, fontSize: 13 }}>{err}</Text>}

      <Pressable
        disabled={saving}
        onPress={submit}
        style={{
          marginTop: 16,
          backgroundColor: brand.blue,
          borderRadius: 12,
          paddingVertical: 14,
          alignItems: "center",
          opacity: saving ? 0.5 : 1,
        }}
      >
        <Text style={{ color: brand.white, fontWeight: "800", fontSize: 15 }}>
          {saving ? "Creating…" : "Create posting"}
        </Text>
      </Pressable>
    </Card>
  );
}

function PostingCard({ posting, onChanged }: { posting: Posting; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const pay = formatPay({ min: posting.payMin, max: posting.payMax, period: posting.payPeriod, tips: posting.tips });
  const tone = STATUS_TONE[posting.status] ?? STATUS_TONE.draft;

  const toggle = useCallback(async () => {
    setBusy(true);
    try {
      await apiSend("PATCH", `/api/mobile/postings/${posting.id}`, {
        status: posting.status === "open" ? "closed" : "open",
      });
      onChanged();
    } catch (e) {
      Alert.alert("Couldn't update", e instanceof Error ? e.message : "Try again.");
    } finally {
      setBusy(false);
    }
  }, [posting.id, posting.status, onChanged]);

  const remove = useCallback(() => {
    Alert.alert(
      "Delete posting?",
      "The link stops working. Anyone who already applied keeps their record.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setBusy(true);
            try {
              await apiSend("DELETE", `/api/mobile/postings/${posting.id}`);
              onChanged();
            } catch (e) {
              Alert.alert("Couldn't delete", e instanceof Error ? e.message : "Try again.");
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  }, [posting.id, onChanged]);

  return (
    <Card>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: "800", fontSize: 16, color: brand.ink }}>
            {posting.title}
            {posting.location ? <Text style={{ color: brand.inkMuted, fontWeight: "400" }}> · {posting.location}</Text> : null}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
            <View style={{ backgroundColor: tone.bg, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 3 }}>
              <Text style={{ color: tone.fg, fontWeight: "700", fontSize: 12 }}>{posting.status}</Text>
            </View>
            {pay ? (
              <Text style={{ color: brand.inkMuted, fontSize: 13 }}>{pay}</Text>
            ) : (
              <Text style={{ color: brand.amber, fontSize: 13 }}>⚠ No pay range</Text>
            )}
          </View>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 18, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
        <LinkBtn label="Share" onPress={() => Share.share({ message: posting.url, url: posting.url, title: posting.title })} />
        <LinkBtn label="Open" onPress={() => WebBrowser.openBrowserAsync(posting.url)} />
        <LinkBtn
          label={posting.status === "open" ? "Close" : "Reopen"}
          onPress={toggle}
          disabled={busy}
        />
        <LinkBtn label="Delete" onPress={remove} disabled={busy} danger />
      </View>
    </Card>
  );
}

/* ---- small building blocks ---- */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: brand.white,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: brand.line,
        padding: 16,
        marginTop: 12,
      }}
    >
      {children}
    </View>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ fontSize: 12, fontWeight: "700", color: brand.inkMuted, marginTop: 14, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
      {children}
    </Text>
  );
}

function ChipRow({
  options,
  value,
  onChange,
  style,
}: {
  options: { key: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  style?: object;
}) {
  return (
    <View style={[{ flexDirection: "row", flexWrap: "wrap", gap: 8 }, style]}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
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
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function PayInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={brand.inkMuted}
      keyboardType="decimal-pad"
      style={{
        borderWidth: 1,
        borderColor: brand.line,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        width: 90,
        color: brand.ink,
        backgroundColor: brand.white,
      }}
    />
  );
}

function LinkBtn({
  label,
  onPress,
  disabled,
  danger,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={{ opacity: disabled ? 0.4 : 1 }}>
      <Text style={{ color: danger ? feedback.dangerSolid : brand.blueDeep, fontWeight: "700", fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

function ShareCard({ title, url, subtitle }: { title: string; url: string; subtitle: string }) {
  return (
    <Card>
      <Text style={{ fontWeight: "800", fontSize: 16, color: brand.ink }}>{title}</Text>
      <Text style={{ color: brand.inkMuted, fontSize: 13, marginTop: 2 }}>{subtitle}</Text>
      <Text style={{ fontFamily: "monospace", fontSize: 12, color: brand.ink, marginTop: 8 }} numberOfLines={1}>
        {url}
      </Text>
      <View style={{ flexDirection: "row", gap: 18, marginTop: 10 }}>
        <LinkBtn label="Share" onPress={() => Share.share({ message: url, url, title })} />
        <LinkBtn label="Open" onPress={() => WebBrowser.openBrowserAsync(url)} />
      </View>
    </Card>
  );
}
