import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LinkedText } from "@/components/linked-text";
import { RideMap } from "@/components/ride-map";
import { Timeline } from "@/components/timeline";
import { getAdventure, listAdventures } from "@/lib/adventures";
import { formatCaptureDate, STOP_COLORS } from "@/lib/geo-format";
import { photoStops } from "@/lib/photo-stops";

type AdventurePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return listAdventures().map((adventure) => ({ slug: adventure.slug }));
}

export async function generateMetadata({ params }: AdventurePageProps): Promise<Metadata> {
  const { slug } = await params;
  const adventure = getAdventure(slug);
  if (!adventure) {
    return { title: "Ride not found" };
  }
  return {
    title: adventure.title,
    description: adventure.summary.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"),
  };
}

export default async function AdventurePage({ params }: AdventurePageProps) {
  const { slug } = await params;
  const adventure = getAdventure(slug);
  if (!adventure) {
    notFound();
  }

  const stops = photoStops(adventure.moments);
  const dates = [...new Set(stops.flatMap((stop) => (stop.takenAt ? [stop.takenAt.slice(0, 10)] : [])))];

  return (
    <main id="content" className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
      <Link
        href="/"
        className="text-xs font-medium uppercase tracking-[0.18em] text-moss hover:text-blaze"
      >
        All rides
      </Link>
      <div className="mt-6 grid items-end gap-6 sm:grid-cols-[9.5rem_minmax(0,1fr)]">
        <Image
          src={adventure.coverSrc}
          alt={adventure.coverAlt}
          width={adventure.coverWidth}
          height={adventure.coverHeight}
          priority
          sizes="160px"
          className="h-40 w-full object-cover object-[center_30%] sm:h-48"
        />
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-blaze">
            {adventure.dateLabel} · {adventure.location}
          </p>
          <h1 className="mt-2 font-display text-4xl leading-[1.02] tracking-tight sm:text-5xl">
            {adventure.title}
          </h1>
        </div>
      </div>
      <LinkedText
        text={adventure.summary}
        className="mt-6 max-w-prose text-lg leading-relaxed text-ink-soft"
      />
      <dl className="mt-6 flex flex-wrap gap-3">
        {adventure.stats.map((stat) => (
          <div key={stat.label} className="border border-line bg-card px-3 py-2">
            <dt className="text-[0.65rem] uppercase tracking-[0.16em] text-ink-soft">{stat.label}</dt>
            <dd className="font-medium">{stat.value}</dd>
          </div>
        ))}
      </dl>
      {stops.length > 0 ? (
        <section className="mt-10" aria-labelledby="route-heading">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="route-heading" className="font-display text-3xl tracking-tight">
                Where the photos were taken
              </h2>
              <p className="mt-1 max-w-prose text-sm text-ink-soft">
                Pins follow the pictures in the order the camera recorded them.
              </p>
            </div>
            <ul className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.14em] text-ink-soft">
              {dates.map((date, index) => (
                <li key={date} className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: STOP_COLORS[index % STOP_COLORS.length] }}
                  />
                  {formatCaptureDate(date)}
                </li>
              ))}
            </ul>
          </div>
          <RideMap stops={stops} dates={dates} />
        </section>
      ) : null}
      <Timeline moments={adventure.moments} />
    </main>
  );
}
