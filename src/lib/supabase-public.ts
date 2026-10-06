import { createClient } from "@supabase/supabase-js";

// عميل للقراءة العامة بدون كوكيز => الصفحات تتخزّن (ISR) وتتحمّل بسرعة جدًا
export const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "anon",
  { auth: { persistSession: false, autoRefreshToken: false } }
);
