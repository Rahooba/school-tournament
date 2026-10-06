import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// عميل للمسؤول (بيقرأ الكوكيز) - يُستخدم في صفحات /admin والـ Server Actions فقط
export async function supabaseServer() {
  const store = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (list: { name: string; value: string; options: CookieOptions }[]) => {
          try {
            list.forEach(({ name, value, options }) => store.set(name, value, options));
          } catch {
            /* called from a Server Component - ignore */
          }
        },
      },
    }
  );
}

export async function requireAdmin() {
  const sb = await supabaseServer();
  const { data } = await sb.auth.getUser();
  if (!data.user) throw new Error("غير مصرّح");
  return sb;
}
