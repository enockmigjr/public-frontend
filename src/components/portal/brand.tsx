import Image from "next/image";
import Link from "next/link";

interface BrandProps {
  readonly href?: string;
  readonly interactive?: boolean;
}

export function Brand({ href = "/", interactive = true }: BrandProps) {
  const content = (
    <>
      <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-border">
        <Image
          src="/logo.png"
          alt="Logo KAMGOKO ITSM"
          width={40}
          height={40}
          className="size-full object-contain"
        />
      </span>
      <span className="min-w-0">
        <strong className="block truncate text-sm tracking-tight">KAMGOKO ITSM</strong>
        <span className="block truncate text-xs text-muted-foreground">Assistance Télécom</span>
      </span>
    </>
  );
  if (!interactive) return <div className="flex items-center gap-2.5">{content}</div>;
  return (
    <Link href={href} className="flex items-center gap-2.5 rounded-lg">
      {content}
    </Link>
  );
}
