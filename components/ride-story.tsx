"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { StoryMap } from "@/components/story-map";
import { StoryMedia } from "@/components/story-media";
import { MomentText, rideChapters, stopNumbers } from "@/components/timeline";
import type { MapStop, Moment } from "@/lib/types";

export function RideStory({ moments, stops }: { moments: Moment[]; stops: MapStop[] }) {
  const chapters = useMemo(() => rideChapters(moments), [moments]);
  const numbers = useMemo(() => stopNumbers(moments), [moments]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const elements = moments.flatMap((moment) => {
      const element = document.getElementById(moment.id);
      return element && moment.kind === "stop" ? [element] : [];
    });
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) {
          setActiveId(visible.target.id);
        }
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    for (const element of elements) {
      observer.observe(element);
    }
    return () => observer.disconnect();
  }, [moments]);

  const scrollToMoment = useCallback((momentId: string) => {
    document.getElementById(momentId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const active = moments.find((moment) => moment.id === activeId);
  const activeHasPins = stops.some((stop) => stop.momentId === activeId);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:gap-12">
      {stops.length > 0 ? (
        <aside className="order-first lg:order-last">
          <div className="relative h-72 overflow-hidden border border-line lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
            <StoryMap
              stops={stops}
              numbers={numbers}
              activeMomentId={activeId}
              onSelect={scrollToMoment}
            />
            <div className="pointer-events-none absolute top-3 left-3 z-[1000] max-w-[calc(100%-1.5rem)] bg-pine/90 px-3 py-2 text-paper shadow-lg">
              <p className="text-[0.65rem] uppercase tracking-[0.18em] text-paper/70">
                {active ? active.day.split(" · ")[0] : "The whole ride"}
              </p>
              <p className="font-display text-lg leading-tight">
                {active
                  ? `${String(numbers.get(active.id) ?? "").padStart(2, "0")} · ${active.title}`
                  : "Scroll to follow along"}
              </p>
              {active && !activeHasPins ? (
                <p className="mt-0.5 text-xs text-paper/70">No GPS on these photos</p>
              ) : null}
            </div>
          </div>
        </aside>
      ) : null}
      <div className="min-w-0 space-y-24">
        {chapters.map((chapter) => {
          const stopCount = chapter.moments.filter((moment) => moment.kind === "stop").length;
          return (
            <section key={chapter.day} aria-label={chapter.label}>
              <header className="bg-pine px-6 py-8 text-paper sm:px-8">
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-blaze">
                  {chapter.label} · {stopCount} stops
                </p>
                {chapter.detail ? (
                  <p className="mt-2 font-display text-4xl leading-tight tracking-tight sm:text-5xl">
                    {chapter.detail}
                  </p>
                ) : null}
              </header>
              <ol className="mt-14 space-y-20">
                {chapter.moments.map((moment) =>
                  moment.kind === "note" ? (
                    <li key={moment.id} id={moment.id} className="scroll-mt-6">
                      <blockquote className="border-l-4 border-blaze bg-card px-6 py-7 sm:px-8">
                        <p className="text-xs font-medium uppercase tracking-[0.2em] text-moss">
                          Bike notes
                        </p>
                        <h3 className="mt-2 font-display text-3xl tracking-tight">{moment.title}</h3>
                        <MomentText text={moment.text} className="mt-4 text-lg" />
                      </blockquote>
                    </li>
                  ) : (
                    <li key={moment.id} id={moment.id} className="scroll-mt-6">
                      <article>
                        <div className="flex items-baseline gap-4">
                          <span className="font-display text-3xl text-blaze tabular-nums">
                            {String(numbers.get(moment.id) ?? "").padStart(2, "0")}
                          </span>
                          <h3 className="font-display text-3xl leading-tight tracking-tight sm:text-4xl">
                            {moment.title}
                          </h3>
                        </div>
                        <MomentText text={moment.text} className="mt-4 text-base sm:text-lg" />
                        {moment.media.length > 0 ? (
                          <div className="mt-6">
                            <StoryMedia items={moment.media} priority={numbers.get(moment.id) === 1} />
                          </div>
                        ) : null}
                      </article>
                    </li>
                  ),
                )}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}
