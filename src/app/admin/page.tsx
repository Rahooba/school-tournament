import Link from "next/link";
import { SPORTS } from "@/lib/types";

export default function AdminHome() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Object.values(SPORTS).map((s) => (
        <div key={s.slug} className="card p-5">
          <h2 className="mb-3 text-lg font-extrabold">{s.icon} {s.name}</h2>
          <div className="flex flex-wrap gap-2">
            <Link href={`/admin/${s.slug}/teams`} className="btn btn-primary">الفرق</Link>
            <Link href={`/admin/${s.slug}/matches`} className="btn btn-primary">المباريات</Link>
            <Link href={`/admin/${s.slug}/players`} className="btn btn-primary">اللاعبين</Link>
          </div>
        </div>
      ))}
    </div>
  );
}
