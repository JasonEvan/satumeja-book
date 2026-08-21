import type { Metadata } from "next";
import { Baloo_2, Inter } from "next/font/google";
import "./globals.css";

const baloo2 = Baloo_2({
  variable: "--font-baloo-2",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
  preload: true,
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
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
      <body className="m-0 min-h-screen bg-cream font-inter text-ink">
        {children}
      </body>
    </html>
  );
}
