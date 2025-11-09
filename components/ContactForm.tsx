"use client";
import { useEffect, useState } from "react";

type Props = { className?: string; endpoint?: string };
type Status = { type: "idle" | "loading" | "success" | "error"; msg?: string };
type StatusResponse = { devMode: boolean; missing?: string[] };
type ApiResponse = {
  ok: boolean;
  error?: string;
  devMode?: boolean;
  missing?: string[];
};

export default function ContactForm({
  className,
  endpoint = "/api/contact",
}: Props) {
  const [values, setValues] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<Status>({ type: "idle" });
  const [devMode, setDevMode] = useState<boolean>(false);
  const [missingVars, setMissingVars] = useState<string[]>([]);

  // Show dev banner immediately on page load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(endpoint, { method: "GET" });
        const data: StatusResponse | null = await res.json().catch(() => null);
        if (!cancelled && data) {
          setDevMode(Boolean(data.devMode));
          setMissingVars(Array.isArray(data.missing) ? data.missing : []);
        }
      } catch {
        // If status check fails, do nothing; banner will still show after first POST if dev
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [endpoint]);

  const validate = () => {
    if (!values.name.trim()) return "Name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
      return "Valid email is required";
    if (values.message.trim().length < 10)
      return "Message must be at least 10 characters";
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) return setStatus({ type: "error", msg: err });
    setStatus({ type: "loading" });

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data: ApiResponse | null = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        return setStatus({
          type: "error",
          msg: data?.error || `Request failed (${res.status})`,
        });
      }

      // Update dev banner state based on POST response too
      setDevMode(Boolean(data.devMode));
      setMissingVars(Array.isArray(data.missing) ? data.missing : missingVars);

      // Use different success copy in dev mode
      if (data.devMode) {
        setStatus({
          type: "success",
          msg: "Submission logged to server console (no email sent).",
        });
      } else {
        setStatus({ type: "success", msg: "Thanks! We’ll be in touch soon." });
      }

      setValues({ name: "", email: "", message: "" });
    } catch {
      setStatus({ type: "error", msg: "Network error. Please try again." });
    }
  };

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }));

  const devBannerMessage = devMode
    ? `Development mode: Resend is not fully configured${
        missingVars.length ? ` (missing: ${missingVars.join(", ")})` : ""
      }. Form submissions are NOT emailed; data is logged to the server console.`
    : null;

  return (
    <form onSubmit={onSubmit} className={className ?? ""}>
      {devBannerMessage && (
        <p className="mb-4 rounded-md border border-yellow-600 bg-yellow-50 p-3 text-sm text-yellow-800">
          {devBannerMessage}
        </p>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-2xl">
            Your group or name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={values.name}
            onChange={onChange}
            className="mt-4 w-full rounded-md border border-gray-700 bg-white focus:border-black focus:ring-0 p-2"
            required
            aria-required="true"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-2xl">
            Your email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={values.email}
            onChange={onChange}
            className="mt-4 w-full rounded-md border border-gray-700 bg-white focus:border-black focus:ring-0 p-2"
            required
            aria-required="true"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-2xl">
            What&rsquo;s on your mind?
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            value={values.message}
            onChange={onChange}
            className="mt-4 w-full rounded-md border border-gray-700 bg-white focus:border-black focus:ring-0 p-2"
            required
            aria-required="true"
          />
        </div>
      </div>

      {status.type === "error" && (
        <p className="mt-3 text-sm text-red-600">{status.msg}</p>
      )}
      {status.type === "success" && (
        <p className="mt-3 text-sm text-green-600">{status.msg}</p>
      )}

      <button
        type="submit"
        disabled={status.type === "loading"}
        className="mt-6 inline-flex cursor-pointer items-center rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800 disabled:opacity-60"
      >
        {status.type === "loading" ? "Sending…" : "Send"}
      </button>
    </form>
  );
}
