import { getTables, getRates, getStoreSettings } from "@/lib/booking-service";
import Image from "next/image";
import BookingForm from "./booking-form";

export default async function Home() {
  // SSR: Fetch initial data from Supabase on the server
  const [initialTables, initialRates, initialStoreSettings] = await Promise.all(
    [getTables(), getRates(), getStoreSettings()],
  );

  // Structured Data (JSON-LD) for LocalBusiness SEO
  const openingHoursText = `${String(initialStoreSettings.openingHour).padStart(
    2,
    "0",
  )}:00-${String(initialStoreSettings.closingHour).padStart(2, "0")}:00`;
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
    openingHours: `Mo-Su ${openingHoursText}`,
    url: "https://satumeja.com",
  };

  return (
    <main className="booking-page">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="booking-page__pattern" aria-hidden="true" />

      <header className="site-header">
        <a
          className="brand"
          href="#top"
          aria-label="Satu Meja — kembali ke atas"
        >
          <Image
            className="brand-logo"
            src="/icon.webp"
            alt=""
            width={707}
            height={353}
            sizes="(max-width: 520px) 148px, 178px"
          />
        </a>

        <a className="header-location" href="#booking-form">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 21s7-5.5 7-12A7 7 0 1 0 5 9c0 6.5 7 12 7 12Z" />
            <circle cx="12" cy="9" r="2.25" />
          </svg>
          <span>
            <small>Semarang</small>
            <strong>Jl. Moch. Suyudi No. 71</strong>
          </span>
        </a>
      </header>

      <section className="hero" id="top" aria-labelledby="hero-title">
        <div className="hero__copy">
          <span className="eyebrow">
            <span aria-hidden="true" /> Reservasi online
          </span>
          <h1 id="hero-title">
            Your table,
            <br />
            <em>your good time.</em>
          </h1>
          <p>
            Pilih meja favoritmu, tentukan waktu bermain, dan nikmati momen seru
            bersama orang-orang terdekat.
          </p>
          <div className="hero__details" aria-label="Informasi venue">
            <span>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3.5 2" />
              </svg>
              Buka setiap hari, {openingHoursText.replace("-", " – ")} WIB
            </span>
            <span>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 4h10v16H7zM10 8h4M10 12h4M10 16h2" />
              </svg>
              Booking langsung terkonfirmasi
            </span>
          </div>
          <a className="hero__cta" href="#booking-form">
            Mulai booking
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </a>
        </div>

        <div className="hero__art" aria-hidden="true">
          <Image
            className="hero__illustration"
            src="/vector-transparent.png"
            loading="eager"
            alt=""
            width={1317}
            height={1194}
            sizes="(max-width: 520px) 320px, (max-width: 760px) 350px, (max-width: 980px) 46vw, 620px"
            fetchPriority="high"
          />
        </div>
      </section>

      <section className="booking-intro" aria-labelledby="booking-heading">
        <div>
          <span className="section-number">01</span>
          <p className="eyebrow">Buat reservasi</p>
          <h2 id="booking-heading">Siapkan meja untuk momenmu.</h2>
        </div>
        <p>
          Isi detail di bawah ini. Hanya perlu beberapa langkah sederhana sampai
          mejamu siap.
        </p>
      </section>

      {/* Interactive Booking Form Pre-rendered with Server Data */}
      <div id="booking-form">
        <BookingForm
          initialTables={initialTables}
          initialRates={initialRates}
          initialStoreSettings={initialStoreSettings}
        />
      </div>

      <footer className="site-footer">
        <div className="brand brand--footer">
          <Image
            className="brand-logo"
            src="/icon.webp"
            alt="Satu Meja — Social Mahjong & Game Club"
            width={707}
            height={353}
            sizes="(max-width: 520px) 144px, 162px"
          />
        </div>
        <div className="site-footer__details">
          <p>© {new Date().getFullYear()} FlowPOS · Semarang</p>
          <a
            href="https://wa.me/62895413315500"
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp: +62 895-4133-15500
          </a>
        </div>
      </footer>
    </main>
  );
}
