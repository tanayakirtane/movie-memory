import Link from "next/link";
import { Clapperboard } from "lucide-react";
export function Brand() {
  return (
    <Link
      href="/"
      className="focus-ring inline-flex items-center gap-3 rounded-lg"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-300/35 bg-amber-200/10 text-amber-200">
        <Clapperboard size={20} strokeWidth={1.9} />
      </span>
      <span className="text-lg font-semibold tracking-tight text-white">
        movie<span className="text-[#eec17d]">memory</span>
        <span className="ml-1 text-sm text-amber-300">.</span>
      </span>
    </Link>
  );
}
