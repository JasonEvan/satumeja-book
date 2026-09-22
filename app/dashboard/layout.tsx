import DashboardSidebar from "@/app/dashboard/dashboard-sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#f6f0e1] lg:flex"><DashboardSidebar /><div className="min-w-0 flex-1">{children}</div></div>;
}
