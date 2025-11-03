import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

const hasResendKey = Boolean(process.env.RESEND_API_KEY);
const hasContactFrom = Boolean(process.env.CONTACT_FROM);
const hasContactTo = Boolean(process.env.CONTACT_TO);
const hasResendConfigured = hasResendKey && hasContactFrom && hasContactTo;

const resend = hasResendConfigured
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Status endpoint so the client can show a banner immediately
export async function GET() {
  const missing = [
    !hasResendKey ? "RESEND_API_KEY" : null,
    !hasContactFrom ? "CONTACT_FROM" : null,
    !hasContactTo ? "CONTACT_TO" : null,
  ].filter(Boolean) as string[];

  return NextResponse.json({ devMode: !hasResendConfigured, missing });
}

export async function POST(req: NextRequest) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch (e) {
    console.error("Contact: invalid JSON body", e);
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 }
    );
  }

  const { name, email, message } = payload as {
    name?: string;
    email?: string;
    message?: string;
  };

  if (!name || !email || !message) {
    return NextResponse.json(
      { ok: false, error: "Missing fields" },
      { status: 400 }
    );
  }
  if (!isValidEmail(email)) {
    return NextResponse.json(
      { ok: false, error: "Invalid email" },
      { status: 422 }
    );
  }

  if (!hasResendConfigured) {
    const missing = [
      !hasResendKey ? "RESEND_API_KEY" : null,
      !hasContactFrom ? "CONTACT_FROM" : null,
      !hasContactTo ? "CONTACT_TO" : null,
    ].filter(Boolean) as string[];

    console.warn(
      `Contact: Resend not fully configured → dev mode (console only). Missing: ${missing.join(
        ", "
      )}`
    );
    console.log("Contact: submission (console-only)", { name, email, message });

    return NextResponse.json({ ok: true, devMode: true, missing });
  }

  try {
    const { error } = await resend!.emails.send({
      from: process.env.CONTACT_FROM!,
      to: process.env.CONTACT_TO!,
      replyTo: email,
      subject: `New contact message from ${name}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        "",
        "Message:",
        `${message}`,
      ].join("\n"),
    });

    if (error) {
      console.error("Contact: Resend error", error);
      return NextResponse.json(
        { ok: false, error: "Email send failed" },
        { status: 502 }
      );
    }

    console.log("Contact: submission delivered via Resend", { name, email });
    return NextResponse.json({ ok: true, devMode: false });
  } catch (err) {
    console.error("Contact: unexpected error", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected error" },
      { status: 500 }
    );
  }
}
