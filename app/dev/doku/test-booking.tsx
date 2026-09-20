"use client";

import { FormEvent, useState } from "react";

const initialForm = { name: "", email: "", phone: "", amount: "50000" };

export default function DokuTestBooking() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/dev/doku/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      const result = (await response.json()) as {
        checkoutUrl?: string;
        error?: string;
      };
      if (!response.ok || !result.checkoutUrl)
        throw new Error(result.error || "Sesi pembayaran tidak dapat dibuat.");
      window.location.assign(result.checkoutUrl);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Terjadi kesalahan.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <main className="doku-test-page">
      <section className="doku-test-card" aria-labelledby="doku-test-title">
        <p className="doku-test-badge">DOKU · SANDBOX</p>
        <h1 id="doku-test-title">Uji booking pembayaran</h1>
        <p className="doku-test-intro">
          Form ini hanya membuat sesi DOKU Sandbox. Tidak ada booking atau data
          pelanggan yang disimpan ke database.
        </p>
        <form className="doku-test-form" onSubmit={handleSubmit}>
          <label>
            Nama
            <input
              required
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
            />
          </label>
          <label>
            Email
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
            />
          </label>
          <label>
            Nomor WhatsApp <span>(opsional)</span>
            <input
              type="tel"
              inputMode="tel"
              placeholder="628123456789"
              value={form.phone}
              onChange={(event) =>
                setForm({ ...form, phone: event.target.value })
              }
            />
          </label>
          <label>
            Nominal pembayaran (Rp)
            <input
              required
              type="number"
              min="1000"
              step="1"
              value={form.amount}
              onChange={(event) =>
                setForm({ ...form, amount: event.target.value })
              }
            />
          </label>
          {error && (
            <p className="doku-test-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Mengarahkan ke DOKU…" : "Lanjut ke DOKU Sandbox"}
          </button>
        </form>
        <p className="doku-test-note">
          Gunakan metode pembayaran dan simulator yang tersedia di akun DOKU
          Sandbox.
        </p>
      </section>
    </main>
  );
}
