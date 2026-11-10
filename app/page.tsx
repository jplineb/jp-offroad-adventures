import { AdventureCard } from "@/components/adventure-card";
import { listAdventures } from "@/lib/adventures";

export default function HomePage() {
  const adventures = listAdventures();

  return (
    <main id="content" className="mx-auto max-w-5xl px-5 py-12 sm:py-16">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-moss">Field notes</p>
      <h1 className="mt-3 max-w-3xl font-display text-5xl leading-[0.95] tracking-tight text-ink sm:text-7xl">
        Rides worth writing down.
      </h1>
      <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
        Photos, video, and the stops along the way. Each trip is a folder of notes and media,
        read here as a timeline.
      </p>
      {adventures.length > 0 ? (
        <ul className="mt-12 space-y-10">
          {adventures.map((adventure) => (
            <li key={adventure.slug}>
              <AdventureCard adventure={adventure} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-12 border border-dashed border-line bg-card px-6 py-10 text-ink-soft">
          No rides yet. Add a folder under content/adventures.
        </p>
      )}
    </main>
  );
}
