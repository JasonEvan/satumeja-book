"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { AdminBookingItem } from "@/lib/admin-bookings";

interface AdminPageClientProps {
  authenticated: boolean;
  initialPaymentGatewayEnabled: boolean;
  hasAdminPasswordConfigured: boolean;
  bookings: AdminBookingItem[];
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(value: number | null) {
  if (typeof value !== "number") {
    return "—";
  }

  return `Rp${Math.round(value).toLocaleString("id-ID")}`;
}

const shellStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "560px",
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "#fbf7ec",
  border: "2px solid #1b3a2b",
  borderRadius: "24px",
  padding: "24px",
  boxSizing: "border-box",
  boxShadow: "0 10px 28px -22px rgba(27,58,43,0.45)",
};

const sectionStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #c9a24b",
  borderRadius: "22px",
  padding: "20px",
  boxSizing: "border-box",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  backgroundColor: "#ffffff",
  border: "1.5px solid #d8cfa9",
  borderRadius: "12px",
  padding: "12px 14px",
  fontSize: "14px",
  lineHeight: "20px",
  color: "#1e2620",
  boxSizing: "border-box",
  outline: "none",
  minHeight: "44px",
  WebkitAppearance: "none",
  appearance: "none",
};

const primaryButtonStyle: React.CSSProperties = {
  width: "100%",
  marginTop: "16px",
  backgroundColor: "#1b3a2b",
  color: "#fbf7ec",
  border: "0",
  borderRadius: "16px",
  padding: "14px 16px",
  fontFamily: "var(--font-baloo)",
  fontWeight: 700,
  fontSize: "18px",
  lineHeight: "22px",
  cursor: "pointer",
  WebkitAppearance: "none",
  appearance: "none",
};

const ghostButtonStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #d8cfa9",
  color: "#1b3a2b",
  borderRadius: "12px",
  padding: "10px 14px",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
  WebkitAppearance: "none",
  appearance: "none",
};

const alertErrorStyle: React.CSSProperties = {
  backgroundColor: "#8c2f2f",
  color: "#fbf7ec",
  borderRadius: "16px",
  padding: "14px 16px",
  fontSize: "14px",
  lineHeight: "20px",
  marginBottom: "16px",
};

const alertOkStyle: React.CSSProperties = {
  backgroundColor: "#1b3a2b",
  color: "#fbf7ec",
  borderRadius: "16px",
  padding: "14px 16px",
  fontSize: "14px",
  lineHeight: "20px",
  marginBottom: "16px",
};

function renderToggle(
  paymentGatewayEnabled: boolean,
  isSaving: boolean,
  onClick: () => void,
) {
  return (
    <div
      style={{
        border: "1px solid #d8cfa9",
        borderRadius: "20px",
        backgroundColor: "#fffdf7",
        padding: "16px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ marginBottom: "12px" }}>
        <div
          style={{
            fontSize: "11px",
            lineHeight: "16px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#5c6b60",
            fontWeight: 700,
          }}
        >
          Payment Mode
        </div>
        <div
          style={{
            marginTop: "4px",
            fontFamily: "var(--font-baloo)",
            fontSize: "18px",
            lineHeight: "20px",
            color: "#1b3a2b",
            fontWeight: 700,
          }}
        >
          {paymentGatewayEnabled ? "Midtrans Active" : "Manual Proof"}
        </div>
        <div
          style={{
            marginTop: "8px",
            fontSize: "13px",
            lineHeight: "19px",
            color: "#5c6b60",
          }}
        >
          {paymentGatewayEnabled
            ? "Customer pays instantly with gateway checkout."
            : "Customer uploads transfer proof for admin review."}
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={paymentGatewayEnabled}
        aria-label="Gunakan Payment Gateway"
        disabled={isSaving}
        onClick={onClick}
        style={{
          display: "inline-block",
          width: "92px",
          height: "52px",
          borderRadius: "999px",
          border: `2px solid ${paymentGatewayEnabled ? "#1b3a2b" : "#bda96e"}`,
          backgroundColor: paymentGatewayEnabled ? "#2c5a44" : "#efe1b8",
          padding: "0",
          position: "relative",
          cursor: isSaving ? "not-allowed" : "pointer",
          opacity: isSaving ? 0.7 : 1,
          WebkitAppearance: "none",
          appearance: "none",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: "50%",
            left: paymentGatewayEnabled ? "47px" : "7px",
            width: "36px",
            height: "36px",
            borderRadius: "999px",
            transform: "translateY(-50%)",
            backgroundColor: paymentGatewayEnabled ? "#fbf7ec" : "#1b3a2b",
          }}
        />
        <span
          style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: "10px",
            lineHeight: "12px",
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: paymentGatewayEnabled ? "rgba(251,247,236,0.75)" : "#1b3a2b",
          }}
        >
          OFF
        </span>
        <span
          style={{
            position: "absolute",
            right: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: "10px",
            lineHeight: "12px",
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: paymentGatewayEnabled ? "#fbf7ec" : "rgba(27,58,43,0.65)",
          }}
        >
          ON
        </span>
      </button>
    </div>
  );
}

export default function AdminPageClient({
  authenticated,
  initialPaymentGatewayEnabled,
  hasAdminPasswordConfigured,
  bookings,
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
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentGatewayEnabled: nextValue }),
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
      <section style={shellStyle}>
        <div
          style={{
            backgroundColor: "#8c2f2f",
            color: "#fbf7ec",
            borderRadius: "24px",
            padding: "24px",
          }}
        >
          <h1
            style={{
              margin: "0 0 8px",
              fontFamily: "var(--font-baloo)",
              fontSize: "28px",
              lineHeight: "30px",
            }}
          >
            Admin Payment
          </h1>
          <p style={{ margin: 0, fontSize: "14px", lineHeight: "21px" }}>
            `ADMIN_ACCESS_PASSWORD` belum di-set, jadi halaman admin belum bisa
            dipakai.
          </p>
        </div>
      </section>
    );
  }

  if (!authenticated) {
    return (
      <section style={shellStyle}>
        <div style={cardStyle}>
          <h1
            style={{
              margin: "0 0 8px",
              fontFamily: "var(--font-baloo)",
              fontSize: "30px",
              lineHeight: "32px",
              color: "#1b3a2b",
            }}
          >
            Admin Payment
          </h1>
          <p
            style={{
              margin: "0 0 20px",
              fontSize: "14px",
              lineHeight: "21px",
              color: "#5c6b60",
            }}
          >
            Login untuk mengatur apakah booking memakai Midtrans atau upload
            bukti transfer manual.
          </p>

          {error ? <div style={alertErrorStyle}>{error}</div> : null}

          <label
            htmlFor="admin-password"
            style={{
              display: "block",
              marginBottom: "6px",
              fontFamily: "var(--font-baloo)",
              fontWeight: 700,
              fontSize: "14px",
              lineHeight: "18px",
              color: "#1b3a2b",
            }}
          >
            Password Admin
          </label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            style={inputStyle}
          />

          <button
            type="button"
            onClick={handleLogin}
            disabled={!password.trim() || isLoggingIn}
            style={{
              ...primaryButtonStyle,
              opacity: !password.trim() || isLoggingIn ? 0.45 : 1,
              cursor: !password.trim() || isLoggingIn ? "not-allowed" : "pointer",
            }}
          >
            {isLoggingIn ? "Memproses..." : "Masuk"}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section style={shellStyle}>
      <div style={cardStyle}>
        <div
          style={{
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  fontFamily: "var(--font-baloo)",
                  fontSize: "30px",
                  lineHeight: "32px",
                  color: "#1b3a2b",
                }}
              >
                Admin Payment
              </h1>
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: "14px",
                  lineHeight: "21px",
                  color: "#5c6b60",
                }}
              >
                Ubah mode checkout tanpa deploy ulang.
              </p>
            </div>
            <div>
              <button
                type="button"
                onClick={handleLogout}
                style={ghostButtonStyle}
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {error ? <div style={alertErrorStyle}>{error}</div> : null}
        {message ? <div style={alertOkStyle}>{message}</div> : null}

        <div style={sectionStyle}>
          <p
            style={{
              margin: 0,
              fontFamily: "var(--font-baloo)",
              fontSize: "22px",
              lineHeight: "24px",
              color: "#1b3a2b",
            }}
          >
            Gunakan Payment Gateway
          </p>
          <p
            style={{
              margin: "10px 0 16px",
              fontSize: "14px",
              lineHeight: "21px",
              color: "#5c6b60",
            }}
          >
            Saat aktif, customer bayar lewat Midtrans. Saat nonaktif, customer
            wajib upload bukti transfer dan booking langsung masuk ke status
            reservasi.
          </p>

          {renderToggle(paymentGatewayEnabled, isSaving, () =>
            handleSave(!paymentGatewayEnabled),
          )}

          <div
            style={{
              display: "inline-block",
              marginTop: "16px",
              borderRadius: "999px",
              backgroundColor: "#fff7dd",
              padding: "6px 12px",
              fontSize: "14px",
              lineHeight: "18px",
              fontWeight: 600,
              color: "#1b3a2b",
            }}
          >
            {paymentGatewayEnabled
              ? "Status: Midtrans aktif"
              : "Status: Upload bukti transfer"}
          </div>
        </div>

        <div style={{ ...sectionStyle, marginTop: "20px" }}>
          <h2
            style={{
              margin: 0,
              fontFamily: "var(--font-baloo)",
              fontSize: "22px",
              lineHeight: "24px",
              color: "#1b3a2b",
            }}
          >
            Booking Manual
          </h2>
          <p
            style={{
              margin: "10px 0 16px",
              fontSize: "14px",
              lineHeight: "21px",
              color: "#5c6b60",
            }}
          >
            Daftar 20 booking manual terbaru beserta bukti pembayaran.
          </p>

          {bookings.length === 0 ? (
            <div
              style={{
                border: "1px solid #e4dbc0",
                borderRadius: "16px",
                backgroundColor: "#fffdf7",
                padding: "16px",
                fontSize: "14px",
                lineHeight: "21px",
                color: "#5c6b60",
              }}
            >
              Belum ada booking manual yang bisa ditampilkan.
            </div>
          ) : (
            bookings.map((booking, index) => {
              const hasImageProof =
                !!booking.proofUrl &&
                (booking.paymentProofMimeType?.startsWith("image/") ?? true);

              return (
                <article
                  key={booking.id}
                  style={{
                    marginTop: index === 0 ? 0 : "16px",
                    overflow: "hidden",
                    border: "1px solid #dfd5b6",
                    borderRadius: "20px",
                    backgroundColor: "#fffdf6",
                  }}
                >
                  <div
                    style={{
                      borderBottom: "1px solid #efe5c8",
                      padding: "14px 16px",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontFamily: "var(--font-baloo)",
                        fontSize: "20px",
                        lineHeight: "22px",
                        color: "#1b3a2b",
                      }}
                    >
                      {booking.customerName || "Tanpa nama"}
                    </p>
                    <p
                      style={{
                        margin: "6px 0 0",
                        fontSize: "12px",
                        lineHeight: "18px",
                        color: "#5c6b60",
                      }}
                    >
                      {booking.customerPhone || "No phone"} ·{" "}
                      {booking.assetName || "Asset tidak diketahui"}
                    </p>
                    <div style={{ marginTop: "10px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          marginRight: "8px",
                          marginBottom: "8px",
                          borderRadius: "999px",
                          backgroundColor: "#fff1c8",
                          padding: "6px 12px",
                          fontSize: "11px",
                          lineHeight: "14px",
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: "#1b3a2b",
                        }}
                      >
                        {booking.status || "unknown"}
                      </span>
                      <span
                        style={{
                          display: "inline-block",
                          marginBottom: "8px",
                          borderRadius: "999px",
                          backgroundColor: "#1b3a2b",
                          padding: "6px 12px",
                          fontSize: "11px",
                          lineHeight: "14px",
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: "#fbf7ec",
                        }}
                      >
                        {booking.paymentVerificationStatus || "no proof"}
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: "16px" }}>
                    <div
                      style={{
                        marginBottom: "14px",
                        fontSize: "14px",
                        lineHeight: "21px",
                        color: "#1e2620",
                      }}
                    >
                      <div>
                        <strong>Waktu Booking:</strong>{" "}
                        {formatDateTime(booking.startedAt)}
                      </div>
                      <div>
                        <strong>Selesai Estimasi:</strong>{" "}
                        {formatDateTime(booking.estimatedEndedAt)}
                      </div>
                      <div>
                        <strong>Total:</strong> {formatCurrency(booking.grossAmount)}
                      </div>
                      <div>
                        <strong>Metode Bayar:</strong>{" "}
                        {booking.paymentMethod || "—"}
                      </div>
                    </div>

                    <div
                      style={{
                        border: "1px solid #eadfbc",
                        borderRadius: "16px",
                        backgroundColor: "#ffffff",
                        padding: "12px",
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: "11px",
                          lineHeight: "14px",
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: "#5c6b60",
                        }}
                      >
                        Bukti Pembayaran
                      </p>
                      {hasImageProof ? (
                        <a
                          href={booking.proofUrl!}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: "block",
                            marginTop: "10px",
                            overflow: "hidden",
                            border: "1px solid #e9deb9",
                            borderRadius: "12px",
                            backgroundColor: "#fffdf7",
                          }}
                        >
                          <img
                            src={booking.proofUrl!}
                            alt={`Bukti pembayaran ${booking.customerName || booking.id}`}
                            style={{
                              display: "block",
                              width: "100%",
                              height: "auto",
                            }}
                          />
                        </a>
                      ) : booking.proofUrl ? (
                        <a
                          href={booking.proofUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: "inline-block",
                            marginTop: "10px",
                            borderRadius: "12px",
                            backgroundColor: "#1b3a2b",
                            padding: "10px 14px",
                            color: "#fbf7ec",
                            fontSize: "14px",
                            lineHeight: "18px",
                            fontWeight: 600,
                            textDecoration: "none",
                          }}
                        >
                          Lihat Bukti
                        </a>
                      ) : (
                        <p
                          style={{
                            margin: "10px 0 0",
                            fontSize: "14px",
                            lineHeight: "21px",
                            color: "#5c6b60",
                          }}
                        >
                          Belum ada bukti pembayaran.
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
