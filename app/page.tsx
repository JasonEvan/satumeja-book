import { getTables, getRates, getVouchers } from "@/lib/booking-service";
import BookingForm from "./booking-form";

export default async function Home() {
  // SSR: Fetch initial data from Supabase on the server
  const [initialTables, initialRates, initialVouchers] = await Promise.all([
    getTables(),
    getRates(),
    getVouchers(),
  ]);

  // Structured Data (JSON-LD) for LocalBusiness SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Satu Meja — Social Mahjong & Game Club",
    description:
      "Social Mahjong & Game Club Booking Online di Semarang. Pilihan meja mahjong & resto dengan tarif weekday & weekend.",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Jl. Moch. Suyudi No. 71",
      addressLocality: "Semarang",
      addressRegion: "Jawa Tengah",
      addressCountry: "ID",
    },
    openingHours: "Mo-Su 10:00-23:00",
    url: "https://satumeja.com",
  };

  return (
    <main className="w-full max-w-[560px]">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Brand Header */}
      <header className="text-center mb-5">
        <div className="w-[44px] h-[44px] mx-auto mb-2 relative">
          <div className="absolute inset-[10px] border-[4px] border-pine rounded-[6px]" />
          <span className="absolute w-[12px] h-[12px] rounded-full bg-pine top-0 left-[12px]" />
          <span className="absolute w-[12px] h-[12px] rounded-full bg-red top-0 right-[12px]" />
          <span className="absolute w-[12px] h-[12px] rounded-full bg-gold-soft bottom-0 left-[12px]" />
          <span className="absolute w-[12px] h-[12px] rounded-full bg-gold bottom-0 right-[12px]" />
        </div>
        <h1 className="font-baloo font-extrabold tracking-[0.06em] text-pine text-[22px] m-0 mb-[2px]">
          SATU MEJA
        </h1>
        <p className="m-0 text-muted text-[13px] tracking-[0.04em]">
          Social Mahjong &amp; Game Club
        </p>
      </header>

      {/* Hero Section */}
      <section className="text-center mb-[22px]" aria-label="Informasi Venue">
        <h2 className="font-baloo font-extrabold text-[44px] max-[380px]:text-[34px] text-pine [-webkit-text-stroke:1.5px_var(--color-gold-soft)] mt-[14px] mb-[2px] leading-none">
          BOOKING
        </h2>
        <div>
          <span className="inline-block bg-pine text-cream-2 font-baloo font-semibold text-[13px] px-[18px] py-[6px] rounded-full tracking-[0.03em]">
            Jl. Moch. Suyudi No. 71, Semarang · 10:00 – 23:00
          </span>
        </div>
      </section>

      {/* Interactive Booking Form Pre-rendered with Server Data */}
      <BookingForm
        initialTables={initialTables}
        initialRates={initialRates}
        initialVouchers={initialVouchers}
      />
    </main>
  );
}
