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
          <div className="mb-4">
            <p className="font-baloo text-xl text-pine m-0">
              Gunakan Payment Gateway
            </p>
            <p className="text-sm text-muted mt-2 mb-0 leading-6">
              Saat aktif, customer bayar lewat Midtrans. Saat nonaktif,
              customer wajib upload bukti transfer dan booking langsung masuk
              ke status reservasi.
            </p>
          </div>

          <div className="flex justify-start sm:justify-end">
            <button
              type="button"
              role="switch"
              aria-checked={paymentGatewayEnabled}
              aria-label="Gunakan Payment Gateway"
              disabled={isSaving}
              onClick={() => handleSave(!paymentGatewayEnabled)}
              className={`group relative shrink-0 overflow-hidden rounded-[26px] border px-4 py-3 text-left transition-all duration-300 sm:min-w-[250px] ${
                paymentGatewayEnabled
                  ? "border-pine bg-[linear-gradient(135deg,#1b3a2b_0%,#295540_55%,#3d7458_100%)] text-cream-2 shadow-[0_14px_30px_-18px_rgba(27,58,43,0.8)]"
                  : "border-[#cdbf96] bg-[linear-gradient(135deg,#fffaf0_0%,#f1e4bf_58%,#dccb9d_100%)] text-pine shadow-[0_14px_26px_-20px_rgba(122,96,35,0.55)]"
              } ${isSaving ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_18px_34px_-18px_rgba(27,58,43,0.45)]"}`}
            >
              <span
                className={`pointer-events-none absolute inset-y-0 ${
                  paymentGatewayEnabled ? "right-0" : "left-0"
                } w-24 opacity-70 blur-2xl transition-all duration-300 ${
                  paymentGatewayEnabled ? "bg-[#8ec6aa]/30" : "bg-white/60"
                }`}
              />
              <span className="relative flex items-center justify-between gap-4">
                <span className="min-w-0">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] opacity-80">
                    Payment Mode
                  </span>
                  <span className="mt-1 block font-baloo text-lg leading-none">
                    {paymentGatewayEnabled ? "Midtrans Active" : "Manual Proof"}
                  </span>
                  <span className="mt-1.5 block text-xs leading-5 opacity-85">
                    {paymentGatewayEnabled
                      ? "Customer pays instantly with gateway checkout."
                      : "Customer uploads transfer proof for admin review."}
                  </span>
                </span>

                <span
                  className={`relative flex h-14 w-[92px] shrink-0 items-center rounded-full border px-2 transition-all duration-300 ${
                    paymentGatewayEnabled
                      ? "border-white/25 bg-white/10"
                      : "border-[#bda96e] bg-white/55"
                  }`}
                >
                  <span
                    className={`absolute top-1/2 h-10 w-10 -translate-y-1/2 rounded-full transition-all duration-300 ${
                      paymentGatewayEnabled
                        ? "left-[46px] bg-cream-2 shadow-[0_8px_18px_-8px_rgba(0,0,0,0.45)]"
                        : "left-2 bg-pine shadow-[0_8px_18px_-8px_rgba(27,58,43,0.5)]"
                    }`}
                  />
                  <span className="relative z-10 flex w-full justify-between px-1 text-[10px] font-bold uppercase tracking-[0.14em]">
                    <span
                      className={
                        paymentGatewayEnabled ? "text-cream-2/85" : "text-pine"
                      }
                    >
                      Off
                    </span>
                    <span
                      className={
                        paymentGatewayEnabled ? "text-cream-2" : "text-pine/70"
                      }
                    >
                      On
                    </span>
                  </span>
                </span>
              </span>
            </button>
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
