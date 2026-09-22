import Link from "next/link";

export default function AccessDeniedPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-cream px-4">
      <section className="w-full max-w-md rounded-[2rem] border border-[#d8cfa9] bg-[#fffdf8] p-8 text-center shadow-[0_30px_70px_-40px_rgba(27,58,43,0.6)]">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red/10 font-baloo text-2xl font-bold text-red">
          !
        </span>
        <p className="mt-6 text-[11px] font-bold tracking-[0.2em] text-[#98752b] uppercase">
          Owner Console
        </p>
        <h1 className="mt-2 font-baloo text-3xl font-bold text-pine">
          Akses belum tersedia
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Akun ini belum memiliki peran owner. Hubungi administrator untuk
          mendapatkan akses dashboard.
        </p>
        <Link
          className="mt-6 inline-flex rounded-xl bg-pine px-5 py-3 text-sm font-bold text-cream"
          href="/login"
        >
          Kembali ke login
        </Link>
      </section>
    </main>
  );
}
