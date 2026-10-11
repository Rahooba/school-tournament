"use client";
import { useEffect, useRef } from "react";

/** كارت بيتفتح ويتقفل. بيتفتح تلقائي على الشاشات الكبيرة (أو لو forceOpen). */
export function Collapsible({ title, children, forceOpen = false }: { title: React.ReactNode; children: React.ReactNode; forceOpen?: boolean }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (forceOpen || window.matchMedia("(min-width: 1024px)").matches) ref.current?.setAttribute("open", "");
  }, [forceOpen]);
  return (
    <details ref={ref} className="card group overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 font-extrabold [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <span className="text-slate-400 transition-transform group-open:rotate-180" aria-hidden>⌄</span>
      </summary>
      <div className="border-t border-slate-100 p-4">{children}</div>
    </details>
  );
}
