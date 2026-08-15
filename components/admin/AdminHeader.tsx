import Link from "next/link";
import { Icon } from "@/components/icons/Icon";
import { buttonClassName } from "@/components/ui";
import { getCurrentAdmin } from "@/lib/adminSession";
import { adminLogout } from "@/app/admin/actions";

export async function AdminHeader() {
  const admin = await getCurrentAdmin();

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-6">
        <Link href="/admin" className="flex items-center gap-2.5">
          <span className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-ink text-base font-extrabold text-white">
            N
          </span>
          <span className="text-[15px] font-extrabold tracking-tight text-ink">
            NextGen <span className="text-sub">Admin</span>
          </span>
        </Link>

        <div className="flex-1" />

        {admin && (
          <div className="flex items-center gap-3">
            <span className="hidden text-[13px] font-bold text-ink sm:inline">{admin.name}</span>
            <form action={adminLogout}>
              <button type="submit" className={buttonClassName({ variant: "outline", size: "sm" })}>
                <Icon name="arrow-left" size={14} strokeWidth={2} /> Log out
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
