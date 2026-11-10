import Link from "next/link";

export default function NotFound() {
  return (
    <main id="content" className="mx-auto max-w-3xl px-5 py-20">
      <p className="text-xs uppercase tracking-[0.2em] text-blaze">Off the map</p>
      <h1 className="mt-3 font-display text-5xl">That ride is not here.</h1>
      <Link href="/" className="mt-8 inline-block bg-pine px-4 py-2 text-sm uppercase tracking-[0.16em] text-paper">
        Back to the rides
      </Link>
    </main>
  );
}
