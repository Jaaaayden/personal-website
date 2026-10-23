import { readJsonObject } from "@/lib/jsonBody";
import { clientIp, createRateLimiter } from "@/lib/rateLimit";

const RESEND_URL = "https://api.resend.com/emails";

/* Field caps keep the email readable and stop 10MB payload abuse. */
const LIMITS = { name: 100, email: 200, subject: 150, message: 5000 } as const;

/** 5 sends per IP per 10 minutes. */
const isRateLimited = createRateLimiter(10 * 60_000, 5);

function isConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.CONTACT_TO);
}

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  if (body instanceof Response) return body;

  // Honeypot: real visitors never see this field. Report success so bots
  // don't learn they were caught.
  if (typeof body.website === "string" && body.website.length > 0) {
    return Response.json({ ok: true });
  }

  const fields = {} as Record<keyof typeof LIMITS, string>;
  for (const key of Object.keys(LIMITS) as (keyof typeof LIMITS)[]) {
    const value = body[key];
    if (typeof value !== "string" || value.trim().length === 0) {
      return Response.json({ error: `missing ${key}` }, { status: 400 });
    }
    if (value.length > LIMITS[key]) {
      return Response.json({ error: `${key} is too long` }, { status: 400 });
    }
    fields[key] = value.trim();
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    return Response.json(
      { error: "that email doesn't look right" },
      { status: 400 }
    );
  }

  if (isRateLimited(clientIp(request))) {
    return Response.json(
      { error: "whoa, slow down — try again in a few minutes" },
      { status: 429 }
    );
  }

  if (!isConfigured()) {
    return Response.json(
      { error: "the mailbox isn't set up yet — sorry!" },
      { status: 503 }
    );
  }

  const res = await fetch(RESEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // Resend's shared onboarding sender works without a verified domain as
      // long as CONTACT_TO is the account's own email. `||` not `??`: an env
      // template can leave CONTACT_FROM as an empty string, which must also
      // fall back.
      from: process.env.CONTACT_FROM || "Secret Page <onboarding@resend.dev>",
      to: [process.env.CONTACT_TO],
      reply_to: fields.email,
      subject: `[secret page] ${fields.subject}`,
      text: `From: ${fields.name} <${fields.email}>\n\n${fields.message}`,
    }),
  });

  if (!res.ok) {
    console.error("contact email send failed:", res.status, await res.text());
    return Response.json(
      { error: "sending failed — try again later?" },
      { status: 502 }
    );
  }

  return Response.json({ ok: true });
}
