import OwnerLoginForm from "@/app/login/owner-login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawNext = typeof params.next === "string" ? params.next : "/dashboard";
  const next = rawNext.startsWith("/dashboard") ? rawNext : "/dashboard";

  return <OwnerLoginForm next={next} />;
}
