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
import { Redirect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { brand } from "@/theme";

export default function SignIn() {
  const { session } = useAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in → into the app.
  if (session) return <Redirect href="/(tabs)" />;

  async function sendCode() {
    setError(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: false }, // operators are created on the web
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
        <Text style={{ fontSize: 34, fontWeight: "900", color: brand.ink, letterSpacing: -0.5 }}>
          <Text style={{ color: brand.pink }}>qdx</Text> One
        </Text>
        <Text style={{ marginTop: 8, fontSize: 16, color: brand.inkMuted }}>
          {stage === "email"
            ? "Sign in with your work email — we'll text you a code."
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

        {error && <Text style={{ color: "#dc2626", marginTop: 10 }}>{error}</Text>}

        <Pressable
          onPress={stage === "email" ? sendCode : verify}
          disabled={busy || (stage === "email" ? email.length < 4 : code.length < 4)}
          style={({ pressed }) => [
            {
              marginTop: 20,
              backgroundColor: brand.pink,
              borderRadius: 9999,
              paddingVertical: 16,
              alignItems: "center",
              opacity: pressed ? 0.85 : 1,
            },
            (busy || (stage === "email" ? email.length < 4 : code.length < 4)) && { opacity: 0.4 },
          ]}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
              {stage === "email" ? "Send code" : "Sign in"}
            </Text>
          )}
        </Pressable>

        {stage === "code" && (
          <Pressable onPress={() => setStage("email")} style={{ marginTop: 16, alignItems: "center" }}>
            <Text style={{ color: brand.inkMuted }}>Use a different email</Text>
          </Pressable>
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
