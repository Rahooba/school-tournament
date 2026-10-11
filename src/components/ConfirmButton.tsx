"use client";

/** زرار submit بيسأل "متأكدة؟" قبل ما يبعت الفورم (للحذف مثلاً). */
export function ConfirmButton({ message, className, children }: { message: string; className?: string; children: React.ReactNode }) {
  return (
    <button type="submit" className={className} onClick={(e) => { if (!window.confirm(message)) e.preventDefault(); }}>
      {children}
    </button>
  );
}
