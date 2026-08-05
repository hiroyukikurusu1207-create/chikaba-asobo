import Link from "next/link";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { AdminLogin } from "@/components/AdminLogin";
import { AdminDashboard } from "@/components/AdminDashboard";

export default async function AdminPage() {
  const authed = await isAdminAuthenticated();

  return (
    <main className="flex-1 mx-auto w-full max-w-lg px-4 py-6 flex flex-col gap-5">
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-extrabold">管理画面</h1>
        <Link href="/" className="text-xs text-muted hover:text-foreground hover:underline">
          一覧へ戻る
        </Link>
      </header>
      {authed ? <AdminDashboard /> : <AdminLogin />}
    </main>
  );
}
