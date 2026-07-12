"use client";

import { useState, type FormEvent } from "react";
import styles from "./contact.module.css";

type Status =
  | { state: "idle" }
  | { state: "sending" }
  | { state: "sent" }
  | { state: "error"; message: string };

export function ContactForm() {
  const [status, setStatus] = useState<Status>({ state: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    setStatus({ state: "sending" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const payload: { error?: string } = await res.json().catch(() => ({}));
        setStatus({
          state: "error",
          message: payload.error ?? "something went wrong — try again?",
        });
        return;
      }
      form.reset();
      setStatus({ state: "sent" });
    } catch {
      setStatus({
        state: "error",
        message: "couldn't reach the server — try again?",
      });
    }
  }

  if (status.state === "sent") {
    return (
      <div className={styles.sent} role="status">
        <p className={styles.sentTitle}>📬 sent!</p>
        <p className="text-dim">
          Your idea is on its way to my inbox. Thanks for making it worth the
          grind!
        </p>
        <button
          type="button"
          className="btn"
          onClick={() => setStatus({ state: "idle" })}
        >
          send another
        </button>
      </div>
    );
  }

  const sending = status.state === "sending";

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.label}>name *</span>
          <input
            className={styles.input}
            name="name"
            type="text"
            placeholder="your name"
            maxLength={100}
            required
            disabled={sending}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>email *</span>
          <input
            className={styles.input}
            name="email"
            type="email"
            placeholder="you@example.com"
            maxLength={200}
            required
            disabled={sending}
          />
        </label>
      </div>
      <label className={styles.field}>
        <span className={styles.label}>subject *</span>
        <input
          className={styles.input}
          name="subject"
          type="text"
          placeholder="what's this about?"
          maxLength={150}
          required
          disabled={sending}
        />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>message *</span>
        <textarea
          className={styles.input}
          name="message"
          rows={6}
          placeholder="what should live on this page?"
          maxLength={5000}
          required
          disabled={sending}
        />
      </label>
      {/* Honeypot — hidden from people, tempting to bots. */}
      <input
        className="visually-hidden"
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />
      {status.state === "error" && (
        <p className={styles.error} role="alert">
          {status.message}
        </p>
      )}
      <button type="submit" className="btn btn-accent" disabled={sending}>
        {sending ? "sending…" : "send it 📨"}
      </button>
    </form>
  );
}
