import { login } from "../actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  const { err } = await searchParams;
  return (
    <form action={login} className="card mx-auto mt-10 max-w-sm space-y-4 p-6">
      <h1 className="text-xl font-extrabold">دخول المنظّم</h1>
      {err && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{err}</p>}
      <div><label className="label">الإيميل</label><input name="email" type="email" required className="input" dir="ltr" /></div>
      <div><label className="label">كلمة السر</label><input name="password" type="password" required className="input" dir="ltr" /></div>
      <button className="btn btn-primary w-full">دخول</button>
    </form>
  );
}
