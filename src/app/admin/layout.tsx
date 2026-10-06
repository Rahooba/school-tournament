import { logout } from "./actions";
import { supabaseServer } from "@/lib/supabase-server";

export const metadata = { title: "لوحة التحكم", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const sb = await supabaseServer();
  const { data } = await sb.auth.getUser();
  return (
    <div>
      {data.user && (
        <div className="mb-4 flex items-center justify-between rounded-xl bg-slate-800 px-4 py-2 text-sm text-white">
          <span>⚙️ لوحة التحكم — {data.user.email}</span>
          <form action={logout}><button className="rounded-lg bg-white/10 px-3 py-1 hover:bg-white/20">خروج</button></form>
        </div>
      )}
      {children}
    </div>
  );
}
