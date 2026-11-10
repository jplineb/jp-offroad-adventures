"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { MediaGallery } from "@/components/media-gallery";
import type { Moment } from "@/lib/types";

type ClickedHeader = {
  button: HTMLButtonElement;
  top: number;
};

function suspendScrollAnchoring() {
  document.documentElement.style.overflowAnchor = "none";
  document.body.style.overflowAnchor = "none";
}

function resumeScrollAnchoring() {
  document.documentElement.style.overflowAnchor = "";
  document.body.style.overflowAnchor = "";
}

function keepClickedHeaderInPlace(clicked: ClickedHeader) {
  if (!clicked.button.isConnected) {
    return;
  }
  const delta = clicked.button.getBoundingClientRect().top - clicked.top;
  if (Math.abs(delta) < 1) {
    return;
  }
  const root = document.documentElement;
  const previous = root.style.scrollBehavior;
  root.style.scrollBehavior = "auto";
  window.scrollBy(0, delta);
  root.style.scrollBehavior = previous;
}

export type Chapter = {
  day: string;
  label: string;
  detail: string;
  moments: Moment[];
};

export function Timeline({ moments }: { moments: Moment[] }) {
  const numbers = stopNumbers(moments);
  const firstStop = moments.find((moment) => moment.kind === "stop");
  const [openId, setOpenId] = useState<string | null>(firstStop?.id ?? null);
  const clickedHeader = useRef<ClickedHeader | null>(null);

  useLayoutEffect(() => {
    const clicked = clickedHeader.current;
    if (!clicked) {
      return;
    }
    clickedHeader.current = null;
    keepClickedHeaderInPlace(clicked);
    resumeScrollAnchoring();
  }, [openId]);

  useEffect(() => {
    const openFromHash = () => {
      const id = window.location.hash.replace("#", "");
      if (moments.some((moment) => moment.id === id && moment.kind === "stop")) {
        setOpenId(id);
      }
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [moments]);

  return (
    <div className="mt-16 space-y-20">
      {rideChapters(moments).map((chapter) => (
        <section key={chapter.day} aria-labelledby={chapterId(chapter.day)}>
          <header className="border-b border-pine/20 pb-5">
            <p
              id={chapterId(chapter.day)}
              className="text-xs font-medium uppercase tracking-[0.2em] text-blaze"
            >
              {chapter.label}
            </p>
            {chapter.detail ? (
              <p className="mt-2 font-display text-4xl tracking-tight text-ink sm:text-5xl">
                {chapter.detail}
              </p>
            ) : null}
          </header>
          <ol>
            {chapter.moments.map((moment) => {
              const sequence = numbers.get(moment.id);

              if (moment.kind === "note") {
                return (
                  <li key={moment.id} id={moment.id} className="scroll-mt-24 pt-10">
                    <div className="max-w-3xl border-l-4 border-blaze bg-card px-6 py-6 sm:px-8 sm:py-8">
                      <h3 className="font-display text-3xl tracking-tight">{moment.title}</h3>
                      <MomentText text={moment.text} className="mt-4 text-lg" />
                    </div>
                  </li>
                );
              }

              const open = openId === moment.id;
              const cover = moment.media.find((item) => item.kind === "image");
              const photoCount = moment.media.filter((item) => item.kind === "image").length;
              const videoCount = moment.media.filter((item) => item.kind === "video").length;
              return (
                <li key={moment.id} id={moment.id} className="scroll-mt-24 border-b border-line">
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={(event) => {
                      clickedHeader.current = {
                        button: event.currentTarget,
                        top: event.currentTarget.getBoundingClientRect().top,
                      };
                      suspendScrollAnchoring();
                      setOpenId(open ? null : moment.id);
                    }}
                    className="flex w-full items-center gap-4 py-4 text-left"
                  >
                    {sequence ? (
                      <span className="w-8 shrink-0 font-display text-2xl text-blaze tabular-nums">
                        {String(sequence).padStart(2, "0")}
                      </span>
                    ) : null}
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-2xl tracking-tight text-ink sm:text-3xl">
                        {moment.title}
                      </span>
                      {open ? null : (
                        <span className="mt-1 block truncate text-sm text-ink-soft">
                          {excerpt(moment.text, photoCount, videoCount)}
                        </span>
                      )}
                    </span>
                    {cover && !open ? (
                      <Image
                        src={cover.src}
                        alt=""
                        width={cover.width}
                        height={cover.height}
                        sizes="96px"
                        className="h-16 w-24 shrink-0 object-cover"
                      />
                    ) : (
                      <span className="shrink-0 text-xs uppercase tracking-[0.14em] text-moss">
                        {open ? "Hide" : "Open"}
                      </span>
                    )}
                  </button>
                  {open ? (
                    <div className="pb-8">
                      <MomentText text={moment.text} className="text-base sm:text-lg" />
                      {moment.media.length > 0 ? (
                        <div className="mt-5">
                          <MediaGallery items={moment.media} priority={sequence === 1} />
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}

const EXTERNAL_LINK = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;

export function MomentText({ text, className }: { text: string; className: string }) {
  if (text.length === 0) {
    return null;
  }
  return (
    <div className={`max-w-prose space-y-3 leading-relaxed text-ink-soft ${className}`}>
      {text.split(/\n\n+/).map((paragraph) => (
        <p key={paragraph}>{linkText(paragraph)}</p>
      ))}
    </div>
  );
}

function linkText(paragraph: string) {
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const match of paragraph.matchAll(EXTERNAL_LINK)) {
    const index = match.index ?? 0;
    if (index > last) {
      nodes.push(paragraph.slice(last, index));
    }
    const href = match[2] ?? "";
    nodes.push(
      <a
        key={href + index}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-moss underline decoration-moss/40 underline-offset-2 hover:text-blaze"
      >
        {match[1]}
      </a>,
    );
    last = index + match[0].length;
  }
  if (last < paragraph.length) {
    nodes.push(paragraph.slice(last));
  }
  return nodes;
}

function excerpt(text: string, photoCount: number, videoCount: number): string {
  const sentence = text.split(/(?<=[.!?])\s/)[0]?.trim() ?? "";
  const counts = [
    photoCount > 0 ? `${photoCount} photo${photoCount === 1 ? "" : "s"}` : "",
    videoCount > 0 ? `${videoCount} video${videoCount === 1 ? "" : "s"}` : "",
  ].filter(Boolean);
  if (sentence && counts.length > 0) {
    return `${sentence} · ${counts.join(" · ")}`;
  }
  return sentence || counts.join(" · ");
}

export function rideChapters(moments: Moment[]): Chapter[] {
  const chapters: Chapter[] = [];
  for (const moment of moments) {
    const current = chapters[chapters.length - 1];
    if (current && current.day === moment.day) {
      current.moments.push(moment);
      continue;
    }
    const parts = moment.day.split(" · ");
    chapters.push({
      day: moment.day,
      label: parts[0]?.trim() || "Ride",
      detail: parts.slice(1).join(" · "),
      moments: [moment],
    });
  }
  return chapters;
}

export function stopNumbers(moments: Moment[]): Map<string, number> {
  const numbers = new Map<string, number>();
  let count = 0;
  for (const moment of moments) {
    if (moment.kind !== "stop") {
      continue;
    }
    count += 1;
    numbers.set(moment.id, count);
  }
  return numbers;
}

function chapterId(day: string): string {
  const slug = day
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `day-${slug}`;
}
