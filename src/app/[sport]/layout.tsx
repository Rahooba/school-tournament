import { notFound } from "next/navigation";
import { SPORTS, isSport } from "@/lib/types";
import { SportTabs } from "@/components/SportTabs";

export function generateStaticParams() {
  return [{ sport: "football" }, { sport: "volleyball" }];
}
export const dynamicParams = false;

export default async function SportLayout({ children, params }: { children: React.ReactNode; params: Promise<{ sport: string }> }) {
  const { sport } = await params;
  if (!isSport(sport)) notFound();
  const s = SPORTS[sport];
  return (
    <div>
      <h1 className="mb-4 text-2xl font-extrabold" style={{ color: s.accent }}>{s.icon} {s.name}</h1>
      <SportTabs base={`/${sport}`} tabs={[
        { href: "", label: "الترتيب والنهائي" },
        { href: "/matches", label: "المباريات" },
        { href: "/players", label: "اللاعبين" },
      ]} />
      {children}
    </div>
  );
}
