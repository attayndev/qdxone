/**
 * Telnyx messaging webhook — receives delivery receipts and inbound replies
 * (including STOP/HELP). Telnyx already enforces STOP/HELP opt-out at the carrier
 * level for 10DLC (it suppresses further sends to opted-out numbers on the
 * messaging profile), so this endpoint is for observability + a future in-app
 * opt-out record. It always 200s so Telnyx doesn't retry-storm.
 */

import { NextResponse, type NextRequest } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { verifyTelnyxSignature } from "@/lib/telnyx-verify";

const optOuts = () => adminClient().from("sms_opt_outs");

export const runtime = "nodejs";

// Telnyx pings the URL on save; answer GETs so the form validates.
export async function GET() {
  return NextResponse.json({ ok: true });
}

const STOP_RE = /^\s*(stop|stopall|unsubscribe|cancel|end|quit)\s*$/i;
const START_RE = /^\s*(start|unstop|yes)\s*$/i;

export async function POST(request: NextRequest) {
  // Read the raw body so the signature covers exactly what we parse.
  const raw = await request.text();
  const verdict = verifyTelnyxSignature(
    raw,
    request.headers.get("telnyx-signature-ed25519"),
    request.headers.get("telnyx-timestamp")
  );
  // A present-but-bad signature is a forgery attempt → reject. "unverified"
  // (no TELNYX_PUBLIC_KEY set yet) still processes for observability, but we do
  // NOT persist opt-outs on unverified events (a forged STOP mustn't suppress a
  // real number) — carrier-level 10DLC suppression covers that until the key is set.
  if (verdict === "invalid") {
    return new NextResponse("bad signature", { status: 401 });
  }
  const trusted = verdict === "ok";

  try {
    const body = JSON.parse(raw || "{}") as {
      data?: {
        event_type?: string;
        payload?: {
          from?: { phone_number?: string };
          to?: { phone_number?: string; status?: string }[];
          text?: string;
        };
      };
    };
    const data = body.data;
    const type = data?.event_type;
    const p = data?.payload;

    if (type === "message.received") {
      const from = p?.from?.phone_number ?? "?";
      const text = (p?.text ?? "").trim();
      const isStop = STOP_RE.test(text);
      const isStart = START_RE.test(text);
      console.log(`[telnyx] inbound from ${from}: ${JSON.stringify(text)}${isStop ? " (OPT-OUT)" : ""}`);
      // Persist opt-out/opt-in ONLY on a verified webhook.
      if (trusted && from !== "?") {
        try {
          if (isStop) {
            await optOuts().upsert(
              { phone: from, opted_out_at: new Date().toISOString() },
              { onConflict: "phone" }
            );
          } else if (isStart) {
            await optOuts().delete().eq("phone", from);
          }
        } catch (e) {
          console.error("[telnyx] opt-out persistence failed", e);
        }
      }
    } else if (type === "message.sent" || type === "message.finalized") {
      const status = p?.to?.[0]?.status ?? "?";
      const to = p?.to?.[0]?.phone_number ?? "?";
      if (status && status !== "delivered" && status !== "sent") {
        console.warn(`[telnyx] delivery ${status} to ${to}`);
      }
    }
  } catch (e) {
    console.error("[telnyx] webhook parse error", e);
  }
  return NextResponse.json({ ok: true });
}
