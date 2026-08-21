import { loginAdminAction } from "@/app/admin/actions";
import { buttonClassName, SubmitButton, Input, FormField } from "@/components/ui";

export const revalidate = 0;

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="text-lg font-extrabold text-ink">Admin login</h1>
      <p className="mt-1.5 text-[13px] text-sub">
        Staff access for reviewing vendor submissions. Accounts are created by an existing admin.
      </p>

      {error === "invalid" && (
        <p className="mt-3 rounded-lg bg-wash px-3 py-2 text-[12.5px] font-semibold text-ink">
          Incorrect email or password.
        </p>
      )}

      <form action={loginAdminAction} className="mt-5 flex flex-col gap-3.5">
        <FormField htmlFor="email" label="Email" required>
          <Input id="email" name="email" required type="email" placeholder="you@company.com" />
        </FormField>
        <FormField htmlFor="password" label="Password" required>
          <Input id="password" name="password" required type="password" />
        </FormField>
        <SubmitButton pendingText="Logging in…" className={buttonClassName({ full: true })}>
          Log in
        </SubmitButton>
      </form>
    </div>
  );
}
