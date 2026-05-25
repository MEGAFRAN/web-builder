"use client";
import { ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
  size?: "default" | "wide";
}

export function Modal({ isOpen, onClose, title, children, size = "default" }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const panel = panelRef.current;
    if (!panel) return;
    if (typeof panel.scrollTo === "function") {
      panel.scrollTo(0, 0);
    } else {
      panel.scrollTop = 0;
    }
  }, [isOpen, title]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modal = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4"
    >
      {/* Desktop backdrop */}
      <div
        className="absolute inset-0 bg-black/50 hidden md:block"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        ref={panelRef}
        data-component="modal"
        className={[
          "relative z-10 bg-background overflow-y-auto",
          /* Mobile: full screen */
          "w-full h-full",
          /* Desktop: centered card */
          "md:h-auto md:max-h-[90vh] md:w-full md:rounded-2xl md:shadow-2xl",
          size === "wide" ? "md:max-w-2xl" : "md:max-w-lg",
        ].join(" ")}
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-background flex items-center gap-3 px-4 py-3 border-b border-border">
          {/* Mobile: left arrow */}
          <button
            onClick={onClose}
            className="md:hidden flex-shrink-0 flex items-center justify-center w-8 h-8 -ml-1 text-foreground"
            aria-label="Go back"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Desktop: X button */}
          <button
            onClick={onClose}
            className="hidden md:flex flex-shrink-0 items-center justify-center w-8 h-8 -ml-1 text-foreground hover:text-foreground/70 transition-colors"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>

          {title && (
            <h2 className="text-base font-semibold text-foreground leading-snug line-clamp-2">
              {title}
            </h2>
          )}
        </div>

        {/* Scrollable content */}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
}
