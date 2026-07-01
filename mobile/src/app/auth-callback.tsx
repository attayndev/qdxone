/**
 * OAuth redirect target. On Android the Google redirect (qdxoperator://
 * auth-callback?code=…) arrives here as a deep link rather than returning to
 * openAuthSessionAsync (iOS handles it in-process). We exchange the code for a
 * session and bounce into the app; the tab layout redirects to sign-in if the
 * session didn't take (e.g. the account isn't an operator).
 */
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { completeOAuthCode } from "@/lib/auth";
import { brand } from "@/theme";

export default function AuthCallback() {
  const { code } = useLocalSearchParams<{ code?: string }>();

  useEffect(() => {
    (async () => {
      try {
        if (code) await completeOAuthCode(String(code));
      } catch {
        // exchange failed or not an operator — completeOAuthCode/requireOperator
        // already cleared the session; the tab layout will send us to sign-in.
      } finally {
        router.replace("/(tabs)");
      }
    })();
  }, [code]);

  return (
    <View style={{ flex: 1, backgroundColor: brand.cream, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color={brand.blue} size="large" />
    </View>
  );
}
