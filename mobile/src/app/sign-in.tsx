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

  // Already signed in → into the app.
  if (session) return <Redirect href="/(tabs)" />;

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: brand.cream }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, justifyContent: "center", padding: 24 }}
      >
        <QdxWordmark size={34} />
        <Text style={{ marginTop: 10, fontSize: 16, color: brand.inkMuted }}>
          {stage === "email"
            ? "Sign in with your work email — we'll email you a code."
            : `Enter the code we emailed to ${email}.`}
        </Text>

        {stage === "email" ? (
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
        ) : (
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="6-digit code"
            placeholderTextColor={brand.inkMuted}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            style={inputStyle}
          />
        )}

        {error && <Text style={{ color: feedback.dangerSolid, marginTop: 10 }}>{error}</Text>}

        <Pressable
          onPress={stage === "email" ? sendCode : verify}
          disabled={busy || (stage === "email" ? email.length < 4 : code.length < 4)}
          style={({ pressed }) => [
            {
              marginTop: 20,
              backgroundColor: brand.blue,
              borderRadius: 9999,
              paddingVertical: 16,
              alignItems: "center",
              opacity: pressed ? 0.85 : 1,
            },
            (busy || (stage === "email" ? email.length < 4 : code.length < 4)) && { opacity: 0.4 },
          ]}
        >
          {busy ? (
            <ActivityIndicator color={brand.white} />
          ) : (
            <Text style={{ color: brand.white, fontWeight: "700", fontSize: 16 }}>
              {stage === "email" ? "Send code" : "Sign in"}
            </Text>
          )}
        </Pressable>

        {stage === "code" && (
          <Pressable onPress={() => setStage("email")} style={{ marginTop: 16, alignItems: "center" }}>
            <Text style={{ color: brand.inkMuted }}>Use a different email</Text>
          </Pressable>
        )}

        {stage === "email" && (
          <View style={{ marginTop: 28 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: brand.line }} />
              <Text style={{ color: brand.inkMuted, fontSize: 13 }}>or</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: brand.line }} />
            </View>

            <Pressable
              onPress={() => runSso("google")}
              disabled={ssoBusy !== null || busy}
              style={({ pressed }) => [
                {
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  backgroundColor: brand.white,
                  borderColor: brand.line,
                  borderWidth: 1,
                  borderRadius: 9999,
                  paddingVertical: 14,
                  opacity: pressed ? 0.85 : 1,
                },
                (ssoBusy !== null || busy) && { opacity: 0.5 },
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
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const inputStyle = {
  marginTop: 24,
  backgroundColor: brand.white,
  borderColor: brand.line,
  borderWidth: 1,
  borderRadius: 14,
  paddingHorizontal: 16,
  paddingVertical: 14,
  fontSize: 18,
  color: brand.ink,
} as const;
