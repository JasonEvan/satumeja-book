"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import type { EventAd } from "@/lib/event-ads";

export default function EventAdPopup({ ads }: { ads: EventAd[] }) {
  const [open, setOpen] = useState(true);
  const [index, setIndex] = useState(0);
  const closeButton = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open || ads.length === 0) return;
    const priorFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "Tab") {
        const buttons = dialog.current?.querySelectorAll("button");
        if (!buttons?.length) return;
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      priorFocus?.focus();
    };
  }, [open, ads.length]);

  if (!open || ads.length === 0) return null;
  const ad = ads[index];

  return (
    <div className="event-ad-backdrop">
      <section
        ref={dialog}
        className="event-ad-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Iklan event"
      >
        <button
          ref={closeButton}
          type="button"
          className="event-ad-close"
          aria-label="Tutup iklan"
          onClick={() => setOpen(false)}
        >
          ×
        </button>
        <Image
          className="event-ad-image"
          src={ad.url}
          alt={`Iklan event ${index + 1}`}
          width={1200}
          height={900}
          sizes="(max-width: 700px) 94vw, 680px"
          unoptimized
        />
        {ads.length > 1 && (
          <nav className="event-ad-controls" aria-label="Navigasi iklan">
            <button
              type="button"
              aria-label="Iklan sebelumnya"
              onClick={() => setIndex((index + ads.length - 1) % ads.length)}
            >
              ‹
            </button>
            <span aria-live="polite">
              {index + 1} / {ads.length}
            </span>
            <button
              type="button"
              aria-label="Iklan berikutnya"
              onClick={() => setIndex((index + 1) % ads.length)}
            >
              ›
            </button>
          </nav>
        )}
      </section>
    </div>
  );
}
