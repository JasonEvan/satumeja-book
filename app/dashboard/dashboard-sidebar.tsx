"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type IconName = "overview" | "revenue" | "rental";

const links: Array<{
  href: string;
  label: string;
  description: string;
  icon: IconName;
  exact?: boolean;
}> = [
  { href: "/dashboard", label: "Ringkasan", description: "Performa bisnis", icon: "overview", exact: true },
  { href: "/dashboard/pendapatan", label: "Pendapatan", description: "Semua transaksi", icon: "revenue" },
  { href: "/dashboard/pendapatan/rental", label: "Menu rental", description: "Performa per menu", icon: "rental" },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const activeHref = [...links]
    .sort((a, b) => b.href.length - a.href.length)
    .find((link) =>
      link.exact
        ? pathname === link.href
        : pathname === link.href || pathname.startsWith(`${link.href}/`),
    )?.href;

  return (
    <aside className="relative z-20 border-b border-white/10 bg-pine text-cream lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-[17.5rem] lg:shrink-0 lg:flex-col lg:border-r lg:border-b-0">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full border border-gold/20" />
        <div className="absolute -top-10 -right-10 h-36 w-36 rounded-full border border-gold/20" />
        <div className="absolute bottom-10 -left-24 h-56 w-56 rounded-full bg-white/[0.025]" />
      </div>

      <div className="relative flex items-center justify-between px-5 py-4 lg:px-7 lg:pt-8 lg:pb-6">
        <Link className="flex items-center gap-3" href="/dashboard">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gold text-pine shadow-[0_8px_24px_rgba(201,162,75,0.25)]">
            <span className="font-baloo text-xl font-extrabold">SM</span>
          </span>
          <span>
            <span className="block font-baloo text-xl leading-none font-bold tracking-tight">Satu Meja</span>
            <span className="mt-1 hidden text-[10px] font-semibold tracking-[0.2em] text-cream/50 uppercase sm:block">Owner Console</span>
          </span>
        </Link>
        <span className="rounded-full border border-gold/25 bg-gold/10 px-2.5 py-1 text-[10px] font-bold tracking-wider text-gold-soft uppercase lg:hidden">WIB</span>
      </div>

      <nav aria-label="Navigasi dashboard" className="relative flex gap-2 overflow-x-auto px-4 pb-4 lg:mt-4 lg:flex-col lg:overflow-visible lg:px-5">
        {links.map((link) => {
          const active = activeHref === link.href;
          return (
            <Link
              className={`group relative flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 lg:w-full ${active ? "bg-cream text-pine shadow-[0_12px_32px_rgba(9,30,19,0.22)]" : "text-cream/65 hover:bg-white/[0.07] hover:text-cream"}`}
              href={link.href}
              key={link.href}
            >
              <span className={`grid h-9 w-9 place-items-center rounded-xl transition-colors ${active ? "bg-pine text-gold-soft" : "bg-white/[0.07] text-cream/70 group-hover:text-gold-soft"}`}>
                <SidebarIcon name={link.icon} />
              </span>
              <span>
                <span className="block text-sm font-bold">{link.label}</span>
                <span className={`hidden text-[11px] lg:block ${active ? "text-muted" : "text-cream/35"}`}>{link.description}</span>
              </span>
              {active && <span className="absolute top-1/2 right-3 hidden h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-gold lg:block" />}
            </Link>
          );
        })}
      </nav>

      <div className="relative mt-auto hidden p-5 lg:block">
        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-sm">
          <div className="mb-3 flex items-center gap-2 text-gold-soft">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gold/10"><ClockIcon /></span>
            <span className="text-xs font-bold tracking-wide uppercase">Zona laporan</span>
          </div>
          <p className="text-xs leading-5 text-cream/55">Seluruh waktu dan periode telah disesuaikan ke Indonesia Barat.</p>
          <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3 text-xs font-bold text-cream/80">
            <span className="h-2 w-2 rounded-full bg-[#8fc9a7] shadow-[0_0_0_4px_rgba(143,201,167,0.1)]" />
            Asia/Jakarta · WIB
          </div>
        </div>
      </div>
    </aside>
  );
}

function SidebarIcon({ name }: { name: IconName }) {
  if (name === "overview") return <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18"><rect height="7" rx="2" stroke="currentColor" strokeWidth="1.8" width="7" x="3" y="3"/><rect height="7" rx="2" stroke="currentColor" strokeWidth="1.8" width="7" x="14" y="3"/><rect height="7" rx="2" stroke="currentColor" strokeWidth="1.8" width="7" x="3" y="14"/><rect height="7" rx="2" stroke="currentColor" strokeWidth="1.8" width="7" x="14" y="14"/></svg>;
  if (name === "revenue") return <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18"><path d="M4 7.5h16M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8"/><path d="M8 12h3M8 16h8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8"/></svg>;
  return <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18"><path d="M5 7.5A2.5 2.5 0 0 1 7.5 5h9A2.5 2.5 0 0 1 19 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 16.5v-9Z" stroke="currentColor" strokeWidth="1.8"/><circle cx="9" cy="10" r="1.5" fill="currentColor"/><circle cx="15" cy="10" r="1.5" fill="currentColor"/><circle cx="9" cy="15" r="1.5" fill="currentColor"/><circle cx="15" cy="15" r="1.5" fill="currentColor"/></svg>;
}

function ClockIcon() {
  return <svg aria-hidden="true" fill="none" height="14" viewBox="0 0 24 24" width="14"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M12 7v5l3 2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>;
}
