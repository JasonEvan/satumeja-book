import type { Metadata } from "next";
import { Baloo_2, Inter } from "next/font/google";
import "./globals.css";

const baloo2 = Baloo_2({
  variable: "--font-baloo-2",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Satu Meja — Booking Mahjong",
  description: "Social Mahjong & Game Club - Booking Online",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${baloo2.variable} ${inter.variable}`}>
      <body className="m-0 min-h-screen bg-[radial-gradient(circle_at_8%_6%,rgba(243,196,206,0.35),transparent_40%),radial-gradient(circle_at_92%_90%,rgba(243,196,206,0.3),transparent_38%),var(--color-cream)] font-inter text-ink flex justify-center pt-8 px-4 pb-16">
        {children}
      </body>
    </html>
  );
}
