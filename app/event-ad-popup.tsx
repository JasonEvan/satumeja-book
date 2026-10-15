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
        aria-label="Event dan promo Satu Meja"
      >
        <header className="event-ad-header">
          <div className="event-ad-brand">
            <span className="event-ad-brand-line" aria-hidden="true" />
            <div>
              <strong>Satu Meja</strong>
              <span>Event &amp; promo</span>
            </div>
          </div>
          <button
            ref={closeButton}
            type="button"
            className="event-ad-close"
            aria-label="Tutup iklan"
            onClick={() => setOpen(false)}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </header>
        <div className="event-ad-stage">
          <Image
            className="event-ad-image"
            src={ad.url}
            alt={`Gambar promo ${index + 1} dari ${ads.length}`}
            width={1200}
            height={900}
            sizes="(max-width: 520px) 90vw, 500px"
            loading="eager"
            unoptimized
          />
        </div>
        {ads.length > 1 && (
          <nav className="event-ad-controls" aria-label="Navigasi iklan">
            <div className="event-ad-position" aria-live="polite">
              <strong>{String(index + 1).padStart(2, "0")}</strong>
              <span aria-hidden="true"> / </span>
              <span>{String(ads.length).padStart(2, "0")}</span>
            </div>
            <div className="event-ad-arrows">
              <button
                type="button"
                aria-label="Iklan sebelumnya"
                onClick={() => setIndex((index + ads.length - 1) % ads.length)}
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="m14.5 5-7 7 7 7" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Iklan berikutnya"
                onClick={() => setIndex((index + 1) % ads.length)}
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="m9.5 5 7 7-7 7" />
                </svg>
              </button>
            </div>
          </nav>
        )}
      </section>
    </div>
  );
}
