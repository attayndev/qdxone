import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Platform } from "react-native";
import type { Session } from "@supabase/supabase-js";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import * as AppleAuthentication from "expo-apple-authentication";
import { supabase } from "./supabase";
import { apiGet } from "./api";

/**
 * Auth state for the operator app. Wraps the Supabase session; the root layout
 * gates the tabs on `session`. Sign-in is email one-time-code (verifyOtp) plus
 * Google (browser OAuth, PKCE) and Apple (native, iOS). SSO can mint a brand-new
 * Supabase user, so after it we confirm the account is an operator via
 * /api/mobile/me and sign back out if not — no orphan accounts in the app.
 */
interface AuthValue {
  session: Session | null;
  loading: boolean;
  appleAvailable: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue>({
  session: null,
  loading: true,
  appleAvailable: false,
  signInWithGoogle: async () => {},
  signInWithApple: async () => {},
  signOut: async () => {},
});

/** Thrown when an authenticated user isn't a member of any org. */
export class NotAnOperatorError extends Error {
  constructor() {
    super("This account isn't set up as an operator. Ask your admin, or sign up at qdx.one.");
    this.name = "NotAnOperatorError";
  }
}

/** Confirm the freshly-signed-in user is an operator; sign out + throw if not. */
async function requireOperator() {
  try {
    await apiGet("/api/mobile/me");
  } catch {
    await supabase.auth.signOut();
    throw new NotAnOperatorError();
  }
}

/**
 * Complete a Google OAuth sign-in from the redirect's `code`, then verify the
 * account is an operator. Idempotent — skips the exchange if a session already
 * exists, so the iOS in-app return and the Android deep-link route (see
 * app/auth-callback.tsx) can't both spend the one-time PKCE code.
 */
export async function completeOAuthCode(code: string): Promise<void> {
  const { data: existing } = await supabase.auth.getSession();
  if (!existing.session) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
  }
  await requireOperator();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    if (Platform.OS === "ios") {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
    }
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signInWithGoogle() {
    const redirectTo = Linking.createURL("auth-callback");
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) throw error;

    // iOS returns the redirect here (ASWebAuthenticationSession captures the
    // custom scheme). Android instead fires it as a deep link that the
    // app/auth-callback route completes — there openAuthSessionAsync just
    // resolves "dismiss", so we no-op and let the route finish the exchange.
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== "success") return;

    const code = Linking.parse(result.url).queryParams?.code;
    if (typeof code === "string") await completeOAuthCode(code);
  }

  async function signInWithApple() {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) throw new Error("No identity token from Apple.");
    const { error } = await supabase.auth.signInWithIdToken({
      provider: "apple",
      token: credential.identityToken,
    });
    if (error) throw error;
    await requireOperator();
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        appleAvailable,
        signInWithGoogle,
        signInWithApple,
        signOut: async () => {
          await supabase.auth.signOut();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
