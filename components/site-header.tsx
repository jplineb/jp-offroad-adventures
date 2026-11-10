import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-pine/15 bg-pine text-paper">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
        <Link href="/" className="group flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid h-9 w-9 place-items-center bg-blaze text-paper"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <path d="M3 19 L12 4 L21 19 Z" />
              <path d="M8 19 L12 11 L16 19 Z" fill="#1b332b" />
            </svg>
          </span>
          <span>
            <span className="block font-display text-lg leading-none tracking-tight">
              JP Offroad
            </span>
            <span className="mt-1 block text-[0.68rem] uppercase tracking-[0.22em] text-paper/70">
              Adventure rides
            </span>
          </span>
        </Link>
        <p className="hidden text-right text-xs uppercase tracking-[0.18em] text-paper/70 sm:block">
          Dirt, snow, and the way back
        </p>
      </div>
    </header>
  );
}
