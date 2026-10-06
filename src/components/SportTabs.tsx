"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SportTabs({ base, tabs }: { base: string; tabs: { href: string; label: string }[] }) {
  const path = usePathname();
  return (
    <div className="mb-5 flex gap-2 overflow-x-auto">
      {tabs.map((t) => {
        const href = base + t.href;
        const active = t.href === "" ? path === base : path.startsWith(href);
        return (
          <Link key={t.href} href={href} prefetch
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold ${active ? "bg-brand text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}>
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
