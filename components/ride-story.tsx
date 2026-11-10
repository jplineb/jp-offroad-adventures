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
  const [mapOpen, setMapOpen] = useState(true);
  const [wide, setWide] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => setWide(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

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
      { rootMargin: readingBand(wide, mapOpen) },
    );
    for (const element of elements) {
      observer.observe(element);
    }
    return () => observer.disconnect();
  }, [moments, wide, mapOpen]);

  const scrollToMoment = useCallback((momentId: string) => {
    document.getElementById(momentId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const active = moments.find((moment) => moment.id === activeId);
  const activeHasPins = stops.some((stop) => stop.momentId === activeId);
  const scrollOffset =
    stops.length === 0
      ? "scroll-mt-6"
      : mapOpen
        ? "scroll-mt-[calc(38svh+1.5rem)] lg:scroll-mt-6"
        : "scroll-mt-16 lg:scroll-mt-6";

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:gap-12">
      {stops.length > 0 ? (
        <aside className="sticky top-0 z-20 order-first -mx-5 self-start lg:static lg:order-last lg:mx-0 lg:self-stretch">
          <div
            className={`relative overflow-hidden border-b border-line shadow-[0_10px_24px_rgb(28_23_18_/_0.18)] transition-[height] duration-300 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:border lg:shadow-none ${
              mapOpen ? "h-[38svh]" : "h-12"
            }`}
          >
            <StoryMap
              stops={stops}
              numbers={numbers}
              activeMomentId={activeId}
              onSelect={scrollToMoment}
            />
            <div
              className={`pointer-events-none absolute z-[1000] bg-pine/90 text-paper lg:inset-auto lg:top-3 lg:left-3 lg:block lg:max-w-[calc(100%-1.5rem)] lg:px-3 lg:py-2 lg:shadow-lg ${
                mapOpen
                  ? "top-3 left-3 max-w-[calc(100%-7.5rem)] px-3 py-2 shadow-lg"
                  : "inset-0 flex items-center pr-28 pl-5"
              }`}
            >
              <div className="min-w-0">
                <p
                  className={`text-[0.65rem] uppercase tracking-[0.18em] text-paper/70 lg:block ${
                    mapOpen ? "" : "hidden"
                  }`}
                >
                  {active ? active.day.split(" · ")[0] : "The whole ride"}
                </p>
                <p className="truncate font-display text-base leading-tight sm:text-lg">
                  {active
                    ? `${String(numbers.get(active.id) ?? "").padStart(2, "0")} · ${active.title}`
                    : "Scroll to follow along"}
                </p>
                {active && !activeHasPins ? (
                  <p className={`mt-0.5 text-xs text-paper/70 lg:block ${mapOpen ? "" : "hidden"}`}>
                    No GPS on these photos
                  </p>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              aria-expanded={mapOpen}
              onClick={() => setMapOpen((open) => !open)}
              className={`absolute right-3 z-[1001] bg-card px-3 py-1.5 text-[0.65rem] font-medium uppercase tracking-[0.16em] text-pine shadow-md lg:hidden ${
                mapOpen ? "top-3" : "top-1/2 -translate-y-1/2"
              }`}
            >
              {mapOpen ? "Hide map" : "Show map"}
            </button>
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
                    <li key={moment.id} id={moment.id} className={scrollOffset}>
                      <blockquote className="border-l-4 border-blaze bg-card px-6 py-7 sm:px-8">
                        <p className="text-xs font-medium uppercase tracking-[0.2em] text-moss">
                          Bike notes
                        </p>
                        <h3 className="mt-2 font-display text-3xl tracking-tight">{moment.title}</h3>
                        <MomentText text={moment.text} className="mt-4 text-lg" />
                      </blockquote>
                    </li>
                  ) : (
                    <li key={moment.id} id={moment.id} className={scrollOffset}>
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

function readingBand(wide: boolean, mapOpen: boolean): string {
  if (wide) {
    return "-40% 0px -55% 0px";
  }
  return mapOpen ? "-55% 0px -40% 0px" : "-30% 0px -65% 0px";
}
