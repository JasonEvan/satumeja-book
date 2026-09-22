"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/utils/supabase/client";

export default function OwnerLoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError("Email atau password tidak valid.");
      setIsSubmitting(false);
      return;
    }

    router.replace(next);
    router.refresh();
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-cream px-4 py-8">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute top-[-14rem] right-[-10rem] h-[34rem] w-[34rem] rounded-full border-[1.5rem] border-gold/15" />
        <div className="absolute bottom-[-12rem] left-[-10rem] h-[30rem] w-[30rem] rounded-full bg-pine/[0.05]" />
      </div>
      <section className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-[#d8cfa9] bg-[#fffdf8] p-6 shadow-[0_30px_70px_-40px_rgba(27,58,43,0.6)] sm:p-9">
        <div
          className="absolute top-0 right-0 h-24 w-24 rounded-bl-[5rem] bg-gold/15"
          aria-hidden="true"
        />
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-pine text-gold-soft shadow-[0_12px_28px_rgba(27,58,43,0.22)]">
          <span className="font-baloo text-2xl font-extrabold">SM</span>
        </div>
        <p className="mt-7 text-[11px] font-bold tracking-[0.22em] text-[#98752b] uppercase">
          Owner Console
        </p>
        <h1 className="mt-2 font-baloo text-4xl leading-none font-bold tracking-tight text-pine">
          Selamat datang.
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Masuk untuk melihat performa dan pendapatan Satu Meja.
        </p>

        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-xs font-bold text-pine">
              Email
            </span>
            <input
              autoComplete="email"
              className="h-12 w-full rounded-xl border border-[#d9cfb0] bg-white px-4 text-sm text-pine outline-none transition placeholder:text-muted/60 focus:border-gold focus:ring-4 focus:ring-gold/10"
              disabled={isSubmitting}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="owner@contoh.com"
              required
              type="email"
              value={email}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-bold text-pine">
              Password
            </span>
            <input
              autoComplete="current-password"
              className="h-12 w-full rounded-xl border border-[#d9cfb0] bg-white px-4 text-sm text-pine outline-none transition placeholder:text-muted/60 focus:border-gold focus:ring-4 focus:ring-gold/10"
              disabled={isSubmitting}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Masukkan password"
              required
              type="password"
              value={password}
            />
          </label>
          {error && (
            <p
              className="rounded-xl bg-red/10 px-4 py-3 text-xs font-semibold text-red"
              role="alert"
            >
              {error}
            </p>
          )}
          <button
            className="flex h-12 w-full items-center justify-center rounded-xl bg-pine px-4 text-sm font-bold text-cream shadow-[0_12px_25px_-16px_rgba(27,58,43,0.7)] transition hover:bg-pine-2 disabled:cursor-wait disabled:opacity-70"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Memeriksa akses..." : "Masuk ke dashboard"}
          </button>
        </form>
      </section>
    </main>
  );
}
