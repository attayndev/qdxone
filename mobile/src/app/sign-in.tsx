import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as AppleAuthentication from "expo-apple-authentication";
import { Redirect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { QdxWordmark } from "@/components/QdxLogo";
import { brand, feedback } from "@/theme";

export default function SignIn() {
  const { session, appleAvailable, signInWithGoogle, signInWithApple } = useAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ssoBusy, setSsoBusy] = useState<null | "google" | "apple">(null);
  const [demoBusy, setDemoBusy] = useState(false);

  // Already signed in → into the app.
  if (session) return <Redirect href="/(tabs)" />;

  /** One-tap demo login (for App reviewers + prospects) — no credentials needed. */
  async function exploreDemo() {
    setError(null);
    setDemoBusy(true);
    try {
      const base = process.env.EXPO_PUBLIC_API_URL ?? "https://qdx.one";
      const res = await fetch(`${base}/api/mobile/demo-session`, { method: "POST" });
      if (!res.ok) throw new Error("Could not start the demo. Try again.");
      const { token_hash } = (await res.json()) as { token_hash: string };
      const { error } = await supabase.auth.verifyOtp({ token_hash, type: "magiclink" });
      if (error) throw error;
      // Session flips → the Redirect above takes over.
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start the demo.");
    } finally {
      setDemoBusy(false);
    }
  }

  async function runSso(which: "google" | "apple") {
    setError(null);
    setSsoBusy(which);
    try {
      await (which === "google" ? signInWithGoogle() : signInWithApple());
      // Success flips session → the Redirect above takes over.
    } catch (e) {
      // Apple's own cancel throws ERR_REQUEST_CANCELED — treat as a no-op.
      const code = (e as { code?: string })?.code;
      if (code !== "ERR_REQUEST_CANCELED") {
        setError(e instanceof Error ? e.message : "Sign-in failed.");
      }
    } finally {
      setSsoBusy(null);
    }
  }

  async function sendCode() {
    setError(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: false, // operators are created on the web
        // Marks this as an app request so the Supabase email template shows the
        // 6-digit code (mobile) instead of the magic link (web). The template
        // branches on {{ .RedirectTo }} === this value. Allow-listed already.
        emailRedirectTo: "qdxoperator://auth-callback",
      },
    });
    setBusy(false);
    if (error) setError(error.message);
    else setStage("code");
  }

  async function verify() {
    setError(null);
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code.trim(),
      type: "email",
    });
    setBusy(false);
    if (error) setError(error.message);
    // On success the auth listener flips session → Redirect above takes over.
  }

  const busyAny = busy || ssoBusy !== null || demoBusy;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: brand.cream }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, justifyContent: "center", padding: 24 }}
      >
        <QdxWordmark size={34} />

        {stage === "email" ? (
          <>
            <Text style={{ marginTop: 10, fontSize: 16, color: brand.inkMuted }}>
              Sign in to manage your hiring.
            </Text>

            {/* The easiest path first — one tap, no typing. */}
            <Pressable
              onPress={() => runSso("google")}
              disabled={busyAny}
              style={({ pressed }) => [
                {
                  marginTop: 24,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  backgroundColor: brand.white,
                  borderColor: brand.line,
                  borderWidth: 1,
                  borderRadius: 9999,
                  paddingVertical: 15,
                  opacity: pressed ? 0.85 : 1,
                },
                busyAny && { opacity: 0.5 },
              ]}
            >
              {ssoBusy === "google" ? (
                <ActivityIndicator color={brand.ink} />
              ) : (
                <>
                  <Text style={{ fontSize: 16, fontWeight: "700" }}>G</Text>
                  <Text style={{ color: brand.ink, fontWeight: "700", fontSize: 16 }}>
                    Continue with Google
                  </Text>
                </>
              )}
            </Pressable>

            {appleAvailable && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={9999}
                style={{ height: 50, marginTop: 12 }}
                onPress={() => runSso("apple")}
              />
            )}

            {/* Or email a one-time code. */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 22 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: brand.line }} />
              <Text style={{ color: brand.inkMuted, fontSize: 13 }}>or use your email</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: brand.line }} />
            </View>

            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@restaurant.com"
              placeholderTextColor={brand.inkMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              style={inputStyle}
            />
            {error && <Text style={{ color: feedback.dangerSolid, marginTop: 10 }}>{error}</Text>}
            <Pressable
              onPress={sendCode}
              disabled={busyAny || email.length < 4}
              style={({ pressed }) => [
                {
                  marginTop: 14,
                  backgroundColor: brand.blue,
                  borderRadius: 9999,
                  paddingVertical: 16,
                  alignItems: "center",
                  opacity: pressed ? 0.85 : 1,
                },
                (busyAny || email.length < 4) && { opacity: 0.4 },
              ]}
            >
              {busy ? (
                <ActivityIndicator color={brand.white} />
              ) : (
                <Text style={{ color: brand.white, fontWeight: "700", fontSize: 16 }}>
                  Email me a code
                </Text>
              )}
            </Pressable>

            {/* One-tap demo — lets App reviewers / prospects explore without an account. */}
            <Pressable
              onPress={exploreDemo}
              disabled={busyAny}
              style={{ marginTop: 22, alignItems: "center", opacity: busyAny ? 0.5 : 1 }}
            >
              {demoBusy ? (
                <ActivityIndicator color={brand.blue} />
              ) : (
                <Text style={{ color: brand.blueDeep, fontWeight: "600", fontSize: 14 }}>
                  Just exploring? Try the demo →
                </Text>
              )}
            </Pressable>
          </>
        ) : (
          <>
            <Text style={{ marginTop: 10, fontSize: 16, color: brand.inkMuted }}>
              Enter the code we emailed to {email}.
            </Text>
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="6-digit code"
              placeholderTextColor={brand.inkMuted}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              style={[inputStyle, { marginTop: 20 }]}
            />
            {error && <Text style={{ color: feedback.dangerSolid, marginTop: 10 }}>{error}</Text>}
            <Pressable
              onPress={verify}
              disabled={busy || code.length < 4}
              style={({ pressed }) => [
                {
                  marginTop: 20,
                  backgroundColor: brand.blue,
                  borderRadius: 9999,
                  paddingVertical: 16,
                  alignItems: "center",
                  opacity: pressed ? 0.85 : 1,
                },
                (busy || code.length < 4) && { opacity: 0.4 },
              ]}
            >
              {busy ? (
                <ActivityIndicator color={brand.white} />
              ) : (
                <Text style={{ color: brand.white, fontWeight: "700", fontSize: 16 }}>Sign in</Text>
              )}
            </Pressable>
            <Pressable onPress={() => setStage("email")} style={{ marginTop: 16, alignItems: "center" }}>
              <Text style={{ color: brand.inkMuted }}>Use a different email</Text>
            </Pressable>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const inputStyle = {
  backgroundColor: brand.white,
  borderColor: brand.line,
  borderWidth: 1,
  borderRadius: 14,
  paddingHorizontal: 16,
  paddingVertical: 14,
  fontSize: 18,
  color: brand.ink,
} as const;
