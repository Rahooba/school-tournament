import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-30 bg-gradient-to-l from-brand to-brand-2 text-white shadow">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="text-lg font-extrabold">🏆 دوري المدرسة</Link>
        <nav className="flex items-center gap-1 text-sm font-semibold">
          <Link href="/football" className="rounded-lg px-3 py-1.5 hover:bg-white/15">⚽ كرة القدم</Link>
          <Link href="/volleyball" className="rounded-lg px-3 py-1.5 hover:bg-white/15">🏐 الطائرة</Link>
          <Link href="/admin" className="rounded-lg px-3 py-1.5 text-white/70 hover:bg-white/15">⚙️</Link>
        </nav>
      </div>
    </header>
  );
}
