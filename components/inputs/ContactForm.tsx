"use client";
import { useState } from "react";

export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

interface ContactFormProps {
  submitLabel?: string | null;
  nameLabel?: string | null;
  emailLabel?: string | null;
  messageLabel?: string | null;
  /** Called after submit with no data (legacy callback). */
  onSubmit?: () => void;
  /** Called after submit with form field values. Takes precedence over onSubmit. */
  onSubmitData?: (data: ContactFormData) => void;
  /** When true, disables the submit button to prevent duplicate submissions. */
  isSubmitting?: boolean;
}

const fieldClass =
  "rounded-md border border-border px-3 py-2 text-sm text-foreground placeholder-muted bg-background focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary";

export function ContactForm({
  submitLabel,
  nameLabel,
  emailLabel,
  messageLabel,
  onSubmit,
  onSubmitData,
  isSubmitting = false,
}: ContactFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmitData) {
      onSubmitData({ name, email, message });
    } else {
      onSubmit?.();
    }
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
          required
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
          required
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
          required
          className={`resize-none ${fieldClass}`}
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-fg transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Sending…" : (submitLabel ?? "Send Message")}
      </button>
    </form>
  );
}
