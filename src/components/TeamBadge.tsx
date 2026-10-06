import Image from "next/image";

export function TeamLogo({ url, name, size = 32 }: { url: string | null; name: string; size?: number }) {
  if (url) {
    return (
      <Image src={url} alt={name} width={size} height={size} sizes={`${size}px`}
        className="shrink-0 rounded-full bg-white object-cover ring-2 ring-slate-200"
        style={{ width: size, height: size }} />
    );
  }
  return (
    <span className="grid shrink-0 place-items-center rounded-full bg-slate-300 text-xs font-bold text-slate-600"
      style={{ width: size, height: size }} aria-hidden>
      {name.slice(0, 1)}
    </span>
  );
}

export function TeamBadge({ name, logo, size = 32, bold = true }: { name: string; logo: string | null; size?: number; bold?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <TeamLogo url={logo} name={name} size={size} />
      <span className={bold ? "font-semibold" : ""}>{name}</span>
    </span>
  );
}
