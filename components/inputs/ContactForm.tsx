"use client";
import { useState } from "react";

interface ContactFormProps {
  submitLabel?: string | null;
  nameLabel?: string | null;
  emailLabel?: string | null;
  messageLabel?: string | null;
  onSubmit?: () => void;
}

const fieldClass =
  "rounded-md border border-border px-3 py-2 text-sm text-foreground placeholder-muted bg-background focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary";

export function ContactForm({ submitLabel, nameLabel, emailLabel, messageLabel, onSubmit }: ContactFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.();
  };

  return (
    <form data-component="contact-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">
          {nameLabel ?? "Name"}
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={fieldClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">
          {emailLabel ?? "Email"}
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={fieldClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">
          {messageLabel ?? "Message"}
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className={`resize-none ${fieldClass}`}
        />
      </div>
      <button
        type="submit"
        className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-fg transition-colors hover:opacity-90"
      >
        {submitLabel ?? "Send Message"}
      </button>
    </form>
  );
}
