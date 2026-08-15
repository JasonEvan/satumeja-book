"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AdminPageClientProps {
  authenticated: boolean;
  initialPaymentGatewayEnabled: boolean;
  hasAdminPasswordConfigured: boolean;
}

export default function AdminPageClient({
  authenticated,
  initialPaymentGatewayEnabled,
  hasAdminPasswordConfigured,
}: AdminPageClientProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [paymentGatewayEnabled, setPaymentGatewayEnabled] = useState(
    initialPaymentGatewayEnabled,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Login admin gagal.");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login admin gagal.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  };

  const handleSave = async (nextValue: boolean) => {
    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/payment-settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentGatewayEnabled: nextValue,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        paymentGatewayEnabled?: boolean;
      };

      if (!response.ok || typeof payload.paymentGatewayEnabled !== "boolean") {
        throw new Error(payload.error || "Gagal menyimpan pengaturan pembayaran.");
      }

      setPaymentGatewayEnabled(payload.paymentGatewayEnabled);
      setMessage(
        payload.paymentGatewayEnabled
          ? "Midtrans diaktifkan kembali."
          : "Midtrans dimatikan. Form booking sekarang mewajibkan upload bukti transfer.",
      );
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan pengaturan pembayaran.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!hasAdminPasswordConfigured) {
    return (
      <section className="w-full max-w-[560px]">
        <div className="bg-red text-cream-2 rounded-3xl p-6">
          <h1 className="font-baloo text-2xl m-0 mb-2">Admin Payment</h1>
          <p className="m-0 text-sm leading-6">
            `ADMIN_ACCESS_PASSWORD` belum di-set, jadi halaman admin belum bisa
            dipakai.
          </p>
        </div>
      </section>
    );
  }

  if (!authenticated) {
    return (
      <section className="w-full max-w-[560px]">
        <div className="bg-cream-2 border-2 border-pine rounded-3xl p-6 shadow-[0_10px_0_-4px_rgba(27,58,43,0.08),0_18px_40px_-20px_rgba(27,58,43,0.35)]">
          <h1 className="font-baloo text-[30px] text-pine m-0 mb-2">
            Admin Payment
          </h1>
          <p className="text-sm text-muted mt-0 mb-5 leading-6">
            Login untuk mengatur apakah booking memakai Midtrans atau upload
            bukti transfer manual.
          </p>

          {error && (
            <div className="bg-red text-cream-2 rounded-2xl p-4 mb-4 text-sm">
              {error}
            </div>
          )}

          <label
            htmlFor="admin-password"
            className="block font-baloo font-semibold text-[13.5px] text-pine mb-1.5 tracking-wide"
          >
            Password Admin
          </label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full bg-white border-[1.5px] border-[#d8cfa9] rounded-xl px-3.5 py-2.5 text-[14px] text-ink outline-none transition-all duration-150 focus:border-pine focus:ring-2 focus:ring-pine/15"
          />

          <button
            type="button"
            onClick={handleLogin}
            disabled={!password.trim() || isLoggingIn}
            className="w-full mt-4 bg-pine text-cream-2 border-none rounded-2xl py-3 px-4 font-baloo font-bold text-lg cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
          >
            {isLoggingIn ? "Memproses..." : "Masuk"}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full max-w-[560px]">
      <div className="bg-cream-2 border-2 border-pine rounded-3xl p-6 shadow-[0_10px_0_-4px_rgba(27,58,43,0.08),0_18px_40px_-20px_rgba(27,58,43,0.35)]">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h1 className="font-baloo text-[30px] text-pine m-0">
              Admin Payment
            </h1>
            <p className="text-sm text-muted mt-1 mb-0 leading-6">
              Ubah mode checkout tanpa deploy ulang.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="bg-white border border-[#d8cfa9] text-pine rounded-xl px-3 py-2 text-sm font-semibold cursor-pointer"
          >
            Logout
          </button>
        </div>

        {error && (
          <div className="bg-red text-cream-2 rounded-2xl p-4 mb-4 text-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-pine text-cream-2 rounded-2xl p-4 mb-4 text-sm">
            {message}
          </div>
        )}

        <div className="rounded-3xl border border-dashed border-gold bg-white p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-baloo text-xl text-pine m-0">
                Gunakan Payment Gateway
              </p>
              <p className="text-sm text-muted mt-2 mb-0 leading-6">
                Saat aktif, customer bayar lewat Midtrans. Saat nonaktif,
                customer wajib upload bukti transfer dan booking langsung masuk
                ke status reservasi.
              </p>
            </div>
            <div className="flex shrink-0 items-center justify-between rounded-2xl border border-[#d8cfa9] bg-[#fffdf5] px-4 py-3 sm:min-w-[210px]">
              <div className="pr-4">
                <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                  Toggle
                </p>
                <p className="m-0 mt-1 text-sm font-semibold text-pine">
                  {paymentGatewayEnabled ? "Midtrans ON" : "Midtrans OFF"}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={paymentGatewayEnabled}
                aria-label="Gunakan Payment Gateway"
                disabled={isSaving}
                onClick={() => handleSave(!paymentGatewayEnabled)}
                className={`relative h-10 w-20 shrink-0 rounded-full border-2 transition-colors duration-200 cursor-pointer ${
                  paymentGatewayEnabled
                    ? "border-pine bg-pine"
                    : "border-[#c7bc98] bg-[#d8cfa9]"
                } ${isSaving ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <span
                  className={`absolute top-1 h-7 w-7 rounded-full bg-cream-2 shadow-sm transition-transform duration-200 ${
                    paymentGatewayEnabled ? "translate-x-11" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="mt-4 inline-flex rounded-full bg-[#fff7dd] px-3 py-1 text-sm font-semibold text-pine">
            {paymentGatewayEnabled
              ? "Status: Midtrans aktif"
              : "Status: Upload bukti transfer"}
          </div>
        </div>
      </div>
    </section>
  );
}
