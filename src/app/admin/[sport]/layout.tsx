import { notFound } from "next/navigation";
import { SPORTS, isSport } from "@/lib/types";
import { SportTabs } from "@/components/SportTabs";

export default async function AdminSportLayout({ children, params }: { children: React.ReactNode; params: Promise<{ sport: string }> }) {
  const { sport } = await params;
  if (!isSport(sport)) notFound();
  const s = SPORTS[sport];
  return (
    <div>
      <h1 className="mb-3 text-xl font-extrabold" style={{ color: s.accent }}>{s.icon} إدارة {s.name}</h1>
      <SportTabs base={`/admin/${sport}`} tabs={[
        { href: "/teams", label: "الفرق" }, { href: "/matches", label: "المباريات" }, { href: "/players", label: "اللاعبين" },
      ]} />
      {children}
    </div>
  );
}
