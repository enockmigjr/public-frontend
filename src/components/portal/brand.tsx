import Link from "next/link";
import { RadioTower } from "lucide-react";

export function Brand({ href = "/" }: { readonly href?: string }) {
  return <Link href={href} className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="grid size-9 place-items-center rounded-lg bg-sky-700 text-white"><RadioTower className="size-5" /></span><span><strong className="block text-sm">Assistance Télécom</strong><span className="block text-xs text-muted-foreground">Espace demandeur</span></span></Link>;
}
