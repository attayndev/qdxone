/**
 * Telnyx messaging webhook — receives delivery receipts and inbound replies
 * (including STOP/HELP). Telnyx already enforces STOP/HELP opt-out at the carrier
 * level for 10DLC (it suppresses further sends to opted-out numbers on the
 * messaging profile), so this endpoint is for observability + a future in-app
 * opt-out record. It always 200s so Telnyx doesn't retry-storm.
 */

import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

// Telnyx pings the URL on save; answer GETs so the form validates.
export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
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
      const isStop = /^\s*(stop|stopall|unsubscribe|cancel|end|quit)\s*$/i.test(text);
      console.log(`[telnyx] inbound from ${from}: ${JSON.stringify(text)}${isStop ? " (OPT-OUT)" : ""}`);
      // Telnyx suppresses future sends to STOP numbers automatically; in-app
      // opt-out persistence can be layered here later.
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
