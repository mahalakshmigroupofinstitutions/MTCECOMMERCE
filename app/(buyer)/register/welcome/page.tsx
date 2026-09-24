import { redirect } from "next/navigation";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";
import { WelcomeRedirect } from "@/components/buyer/WelcomeRedirect";
import { getCurrentBuyer } from "@/lib/session";

export const revalidate = 0;

/* Brief transition shown right after a successful OTP verification, before
 * landing on `next` (the homepage by default). The session already exists by
 * the time this renders — completeBuyerRegistration() (lib/session.ts) set it
 * before redirecting here — so this page only reads it, never creates it. */
export default async function RegisterWelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const buyer = await getCurrentBuyer();
  if (!buyer) redirect("/register");

  return (
    <>
      <PagePlaceholder icon="check" title={`Welcome, ${buyer.name ?? "there"}!`} phase="Taking you to the marketplace…" />
      <WelcomeRedirect to={next ?? "/"} />
    </>
  );
}
