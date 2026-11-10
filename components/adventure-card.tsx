import Image from "next/image";
import Link from "next/link";
import type { Adventure } from "@/lib/types";

export function AdventureCard({ adventure }: { adventure: Adventure }) {
  const photoCount = adventure.moments.reduce(
    (count, moment) => count + moment.media.filter((item) => item.kind === "image").length,
    0,
  );
  const videoCount = adventure.moments.reduce(
    (count, moment) => count + moment.media.filter((item) => item.kind === "video").length,
    0,
  );

  return (
    <article className="overflow-hidden border border-line bg-card shadow-[0_18px_50px_rgb(28_23_18_/_0.08)]">
      <Link href={`/adventures/${adventure.slug}`} className="group block">
        <div className="grid md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="bg-pine">
            <Image
              src={adventure.coverSrc}
              alt={adventure.coverAlt}
              width={adventure.coverWidth}
              height={adventure.coverHeight}
              priority
              sizes="(max-width: 768px) 100vw, 420px"
              className="h-72 w-full object-cover object-[center_30%] md:h-full"
            />
          </div>
          <div className="flex flex-col gap-5 px-6 py-7 sm:px-8">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-blaze">
              {adventure.dateLabel}
              <span className="text-ink-soft"> · {adventure.location}</span>
            </p>
            <h2 className="font-display text-4xl leading-[1.05] tracking-tight text-ink sm:text-5xl">
              {adventure.title}
            </h2>
            <p className="max-w-prose text-lg leading-relaxed text-ink-soft">
              {adventure.summary.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")}
            </p>
            <dl className="grid gap-3 sm:grid-cols-2">
              {adventure.stats.map((stat) => (
                <div key={stat.label} className="border-l-2 border-blaze pl-3">
                  <dt className="text-xs uppercase tracking-[0.16em] text-ink-soft">
                    {stat.label}
                  </dt>
                  <dd className="mt-1 font-medium text-ink">{stat.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-auto flex items-center justify-between gap-3 pt-2 text-sm font-medium uppercase tracking-[0.14em] text-pine">
              <span>
                {adventure.moments.filter((moment) => moment.kind === "stop").length} stops · {photoCount} photos · {videoCount} videos
              </span>
              <span className="text-blaze group-hover:translate-x-0.5">
                Open timeline
              </span>
            </p>
          </div>
        </div>
      </Link>
    </article>
  );
}
