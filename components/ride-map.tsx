"use client";

import { useEffect, useRef } from "react";
import { formatAltitude, formatCapturedAt, stopColor } from "@/lib/geo-format";
import type { MapStop } from "@/lib/types";
import "leaflet/dist/leaflet.css";

type RideMapProps = {
  stops: MapStop[];
  dates: string[];
};

export function RideMap({ stops, dates }: RideMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || stops.length === 0) {
      return;
    }

    let map: import("leaflet").Map | undefined;
    let active = true;

    const mount = async () => {
      const leaflet = await import("leaflet");
      if (!active) {
        return;
      }

      map = leaflet.map(container, {
        scrollWheelZoom: false,
        attributionControl: true,
      });
      leaflet
        .tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
          attribution:
            'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
          subdomains: "abc",
          maxZoom: 17,
        })
        .addTo(map);

      const positions = stops.map((stop) => [stop.lat, stop.lng] as [number, number]);
      leaflet.polyline(positions, { color: "#1b332b", weight: 3, opacity: 0.8 }).addTo(map);

      for (const stop of stops) {
        const color = stopColor(stop.takenAt, dates);
        const icon = leaflet.divIcon({
          className: "ride-pin",
          html: `<span style="display:grid;place-items:center;width:1.75rem;height:1.75rem;border-radius:999px;background:${color};color:#f3ead9;border:2px solid #fbf6ec;font:600 11px/1 Barlow,sans-serif">${stop.sequence}</span>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
        leaflet
          .marker([stop.lat, stop.lng], { icon, alt: `${stop.sequence}. ${stop.title}` })
          .addTo(map)
          .bindPopup(popupHtml(stop), { maxWidth: 240 });
      }

      map.fitBounds(positions, { padding: [28, 28], maxZoom: 13 });
    };

    void mount();

    return () => {
      active = false;
      map?.remove();
    };
  }, [stops, dates]);

  return (
    <div
      ref={containerRef}
      className="ride-map h-[28rem] w-full bg-paper-deep"
      role="region"
      aria-label="Photo locations in the order they were taken"
    />
  );
}

function popupHtml(stop: MapStop): string {
  const when = formatCapturedAt(stop.takenAt);
  const elevation = formatAltitude(stop.altitudeMeters);
  const details = [when, elevation, stop.photoCount > 1 ? `${stop.photoCount} photos` : null]
    .filter((line): line is string => Boolean(line))
    .map((line) => `<p style="margin:0.15rem 0 0;color:#5e5348">${escapeHtml(line)}</p>`)
    .join("");

  return `<a href="#${escapeAttribute(stop.momentId)}" style="display:block;color:#1c1712;text-decoration:none">
    <img src="${escapeAttribute(stop.coverSrc)}" alt="${escapeAttribute(stop.coverAlt)}" style="display:block;width:100%;height:7.5rem;object-fit:cover" />
    <p style="margin:0.45rem 0 0;font-family:Georgia,serif;font-size:1.05rem">${escapeHtml(stop.title)}</p>
    ${details}
  </a>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll('"', "&quot;");
}
