import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LinkedText } from "@/components/linked-text";
import { RideStory } from "@/components/ride-story";
import { getAdventure, listAdventures } from "@/lib/adventures";
import { photoStops } from "@/lib/photo-stops";

type StoryPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return listAdventures().map((adventure) => ({ slug: adventure.slug }));
}

export async function generateMetadata({ params }: StoryPageProps): Promise<Metadata> {
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

export default async function StoryPage({ params }: StoryPageProps) {
  const { slug } = await params;
  const adventure = getAdventure(slug);
  if (!adventure) {
    notFound();
  }

  const stops = photoStops(adventure.moments);
  const landscapeCover = adventure.coverWidth > adventure.coverHeight;
  const media = adventure.moments.flatMap((moment) => moment.media);
  const counts = [
    { label: "Days", value: new Set(adventure.moments.map((moment) => moment.day)).size },
    { label: "Stops", value: adventure.moments.filter((moment) => moment.kind === "stop").length },
    { label: "Photos", value: media.filter((item) => item.kind === "image").length },
    { label: "Videos", value: media.filter((item) => item.kind === "video").length },
  ];

  return (
    <main id="content">
      <section
        className={`relative grid overflow-hidden bg-pine text-paper lg:min-h-[calc(100svh-4.25rem)] ${
          landscapeCover ? "min-h-[85svh]" : "lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)]"
        }`}
      >
        {landscapeCover ? (
          <>
            <Image
              src={adventure.coverSrc}
              alt={adventure.coverAlt}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-pine via-pine/60 to-pine/10 lg:bg-gradient-to-r lg:from-pine lg:via-pine/55 lg:to-transparent"
            />
          </>
        ) : null}
        <div
          className={`relative flex flex-col justify-between gap-12 px-5 py-10 sm:px-10 sm:py-14 lg:px-16 ${
            landscapeCover ? "max-w-3xl" : ""
          }`}
        >
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium uppercase tracking-[0.18em]">
            <Link href="/" className="text-paper/70 hover:text-blaze">
              All rides
            </Link>
            <Link href={`/adventures/${adventure.slug}`} className="text-paper/70 hover:text-blaze">
              Classic view
            </Link>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-blaze">
              {adventure.dateLabel} · {adventure.location}
            </p>
            <h1 className="mt-4 font-display text-5xl leading-[0.95] tracking-tight sm:text-7xl xl:text-8xl">
              {adventure.title}
            </h1>
            <dl className="mt-10 grid max-w-xl gap-4 sm:grid-cols-2">
              {adventure.stats.map((stat) => (
                <div key={stat.label} className="border-l-2 border-blaze pl-4">
                  <dt className="text-xs uppercase tracking-[0.18em] text-paper/60">{stat.label}</dt>
                  <dd className="mt-1 text-lg font-medium">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <a
            href="#story"
            className="self-start text-xs font-medium uppercase tracking-[0.22em] text-paper/70 hover:text-blaze"
          >
            Start the ride ↓
          </a>
        </div>
        {landscapeCover ? null : (
          <div className="relative h-[70svh] lg:h-auto">
            <Image
              src={adventure.coverSrc}
              alt={adventure.coverAlt}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover object-[center_60%]"
            />
          </div>
        )}
      </section>

      <div id="story" className="mx-auto max-w-7xl scroll-mt-6 px-5 py-14 sm:py-20">
        <div className="grid gap-10 border-b border-line pb-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:gap-12">
          <LinkedText
            text={adventure.summary}
            className="max-w-prose font-display text-xl leading-relaxed text-ink sm:text-2xl"
          />
          <dl className="grid grid-cols-2 content-start gap-px self-start bg-line">
            {counts.map((count) => (
              <div key={count.label} className="bg-card px-5 py-4">
                <dt className="text-[0.65rem] uppercase tracking-[0.18em] text-ink-soft">{count.label}</dt>
                <dd className="font-display text-4xl tabular-nums text-pine">{count.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="mt-14">
          <RideStory moments={adventure.moments} stops={stops} />
        </div>
      </div>
    </main>
  );
}
