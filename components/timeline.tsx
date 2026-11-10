import { MediaGallery } from "@/components/media-gallery";
import type { Moment } from "@/lib/types";

export function Timeline({ moments }: { moments: Moment[] }) {
  return (
    <ol className="relative ml-2 border-l border-pine/25 pl-6 sm:ml-4 sm:pl-10">
      {moments.map((moment, index) => {
        const showDay = index === 0 || moments[index - 1]?.day !== moment.day;
        const sequence = String(index + 1).padStart(2, "0");
        return (
          <li id={moment.id} key={moment.id} className="moment relative scroll-mt-24 pb-12 last:pb-0">
            <span
              aria-hidden="true"
              className="absolute top-1.5 -left-[1.95rem] h-3.5 w-3.5 rotate-45 bg-blaze ring-4 ring-paper sm:-left-[2.95rem]"
            />
            {showDay ? (
              <p className="mb-3 inline-block bg-pine px-3 py-1 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-paper">
                {moment.day}
              </p>
            ) : null}
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="font-display text-2xl text-blaze tabular-nums">{sequence}</p>
              <h2 className="font-display text-3xl tracking-tight text-ink">{moment.title}</h2>
            </div>
            {moment.text.length > 0 ? (
              <div className="mt-3 max-w-prose space-y-3 text-base leading-relaxed text-ink-soft sm:text-lg">
                {moment.text.split(/\n\n+/).map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            ) : null}
            {moment.media.length > 0 ? (
              <div className="mt-5">
                <MediaGallery items={moment.media} priority={index === 0} />
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
