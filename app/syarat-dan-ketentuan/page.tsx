"use client";

export default function SyaratDanKetentuanPage() {
  const handleCloseTab = () => {
    if (typeof window !== "undefined") {
      window.close();
      // Fallback if browser blocks window.close() (e.g. direct navigation)
      setTimeout(() => {
        if (!window.closed) {
          window.location.href = "/";
        }
      }, 150);
    }
  };

  return (
    <main className="w-full max-w-2xl mx-auto py-8 px-4 font-inter text-ink">
      {/* Header Back / Close Button */}
      <div className="mb-6">
        <button
          type="button"
          onClick={handleCloseTab}
          className="inline-flex items-center gap-2 font-baloo font-bold text-sm text-pine bg-cream-2 border-[1.5px] border-[#d8cfa9] rounded-xl px-4 py-2.5 hover:border-pine hover:bg-white transition-all shadow-xs cursor-pointer"
        >
          <svg
            className="w-4 h-4 text-pine"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Tutup &amp; Kembali ke Booking
        </button>
      </div>

      {/* Main Container Card */}
      <div className="bg-cream-2 border-2 border-pine rounded-3xl p-6 sm:p-8 relative shadow-[0_10px_0_-4px_rgba(27,58,43,0.08),0_18px_40px_-20px_rgba(27,58,43,0.35)] before:content-[''] before:absolute before:top-1.5 before:right-1.5 before:bottom-1.5 before:left-1.5 before:border before:border-dashed before:border-gold before:rounded-[19px] before:pointer-events-none before:opacity-55">
        <div className="text-center mb-8">
          <span className="bg-pine text-cream-2 font-baloo font-bold text-xs px-4 py-1.5 rounded-full uppercase tracking-wider shadow-xs">
            Kebijakan Resmi
          </span>
          <h1 className="font-baloo font-extrabold text-2xl sm:text-3xl text-pine mt-3 mb-2 tracking-wide">
            Syarat &amp; Ketentuan Booking
          </h1>
          <p className="font-inter text-xs sm:text-sm text-muted">
            Satu Meja Social Mahjong &amp; Game Club
          </p>
        </div>

        <div className="space-y-5 text-[14px] leading-relaxed">
          {/* Section 1 */}
          <section className="bg-white border-[1.5px] border-[#d8cfa9] rounded-2xl p-5 sm:p-6 shadow-xs">
            <h2 className="font-baloo font-bold text-lg text-pine mb-3 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-gold text-pine font-baloo font-extrabold text-sm flex items-center justify-center shrink-0 shadow-xs">
                1
              </span>
              Ketentuan Umum Reservasi
            </h2>
            <ul className="list-disc list-inside space-y-2 text-ink/90 pl-1">
              <li>
                Pemesanan meja dilakukan secara online melalui halaman booking
                resmi Satu Meja.
              </li>
              <li>
                Jam operasional klub dimulai pukul <b>10.00 WIB</b> hingga{" "}
                <b>22.00 WIB</b> setiap hari.
              </li>
              <li>
                Durasi booking dihitung per slot jam (minimal 1 jam penuh).
              </li>
              <li>
                Setiap pemesanan wajib menyertakan Nama Lengkap dan Nomor HP
                aktif yang dapat dihubungi.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="bg-white border-[1.5px] border-[#d8cfa9] rounded-2xl p-5 sm:p-6 shadow-xs">
            <h2 className="font-baloo font-bold text-lg text-pine mb-3 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-gold text-pine font-baloo font-extrabold text-sm flex items-center justify-center shrink-0 shadow-xs">
                2
              </span>
              Tarif &amp; Pembayaran
            </h2>
            <ul className="list-disc list-inside space-y-2 text-ink/90 pl-1">
              <li>
                Penggunaan kode voucher promo wajib dimasukkan sebelum
                mengonfirmasi pesanan. Diskon tidak dapat disusulkan setelah
                transaksi.
              </li>
              <li>
                Total harga yang tertera pada ringkasan pesanan adalah nilai
                final.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="bg-white border-[1.5px] border-[#d8cfa9] rounded-2xl p-5 sm:p-6 shadow-xs">
            <h2 className="font-baloo font-bold text-lg text-pine mb-3 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-gold text-pine font-baloo font-extrabold text-sm flex items-center justify-center shrink-0 shadow-xs">
                3
              </span>
              Keterlambatan &amp; Toleransi Waktu
            </h2>
            <ul className="list-disc list-inside space-y-2 text-ink/90 pl-1">
              <li>
                Waktu sewa dihitung tepat mengacu pada jam mulai yang dipilih
                saat booking.
              </li>
              <li>
                Keterlambatan kedatangan pengunjung <b>tidak menambah</b> durasi
                waktu selesai.
              </li>
              <li>
                Toleransi keterlambatan tanpa konfirmasi adalah <b>15 menit</b>.
              </li>
              <li>
                Jika tidak ada kabar setelah <b>30 menit</b> dari jam mulai,
                reservasi berhak dibatalkan (No-Show) tanpa pengembalian dana.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="bg-white border-[1.5px] border-[#d8cfa9] rounded-2xl p-5 sm:p-6 shadow-xs">
            <h2 className="font-baloo font-bold text-lg text-pine mb-3 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-gold text-pine font-baloo font-extrabold text-sm flex items-center justify-center shrink-0 shadow-xs">
                4
              </span>
              Pembatalan &amp; Reschedule
            </h2>
            <ul className="list-disc list-inside space-y-2 text-ink/90 pl-1">
              <li>
                Perubahan jadwal (reschedule) dapat dilakukan maksimal{" "}
                <b>24 jam (H-1)</b> sebelum jam reservasi melalui tim admin.
              </li>
              <li>
                Pembatalan pada hari H (kurang dari 24 jam) bersifat{" "}
                <i>non-refundable</i>.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="bg-white border-[1.5px] border-[#d8cfa9] rounded-2xl p-5 sm:p-6 shadow-xs">
            <h2 className="font-baloo font-bold text-lg text-pine mb-3 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-gold text-pine font-baloo font-extrabold text-sm flex items-center justify-center shrink-0 shadow-xs">
                5
              </span>
              Tata Tertib &amp; Peralatan
            </h2>
            <ul className="list-disc list-inside space-y-2 text-ink/90 pl-1">
              <li>
                Pengunjung wajib menjaga kebersihan meja, unit otomatis, dan set
                ubin mahjong.
              </li>
              <li>
                Kerusakan atau kehilangan ubin/peralatan akibat kelalaian atau
                kesengajaan akan dikenakan biaya ganti rugi.
              </li>
              <li>
                <b>Dilarang keras</b> melakukan aktivitas perjudian dengan
                taruhan uang tunai di seluruh area klub.
              </li>
              <li>
                Dilarang membawa makanan &amp; minuman dari luar tanpa izin
                pengelola.
              </li>
            </ul>
          </section>
        </div>

        {/* Footer Action Button */}
        <div className="mt-8 text-center pt-6 border-t border-dashed border-[#d8cfa9]">
          <p className="text-xs sm:text-sm text-muted mb-5">
            Dengan mengonfirmasi booking, Anda dianggap telah membaca, memahami,
            dan menyetujui seluruh syarat &amp; ketentuan di atas.
          </p>
          <div>
            <button
              type="button"
              onClick={handleCloseTab}
              className="inline-flex items-center justify-center min-h-[48px] bg-gold text-pine border-none rounded-2xl py-3 px-8 font-baloo font-extrabold text-lg sm:text-xl tracking-wide cursor-pointer transition-all duration-150 shadow-[0_4px_0_0_#a9843a] hover:bg-gold-soft active:translate-y-0.5 active:shadow-[0_2px_0_0_#a9843a]"
            >
              Saya Mengerti &amp; Tutup Halaman Ini
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
