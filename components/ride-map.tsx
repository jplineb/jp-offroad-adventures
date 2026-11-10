"use client";

import { useEffect, useRef } from "react";
import { stopColor } from "@/lib/geo-format";
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
        const marker = leaflet.marker([stop.lat, stop.lng], {
          icon: pinIcon(leaflet, String(stop.sequence), stopColor(stop.takenAt, dates), 28),
          alt: `${stop.sequence}. ${stop.title}`,
          zIndexOffset: stop.sequence,
        });
        marker.on("click", () => {
          window.location.hash = stop.momentId;
          window.dispatchEvent(new HashChangeEvent("hashchange"));
        });
        marker.addTo(map);
      }

      map.fitBounds(positions, { padding: [36, 36], maxZoom: 13 });
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

function pinIcon(
  leaflet: typeof import("leaflet"),
  label: string,
  color: string,
  size: number,
): import("leaflet").DivIcon {
  const font = size >= 34 ? 13 : size >= 26 ? 11 : 9;
  return leaflet.divIcon({
    className: "ride-pin",
    html: `<span style="display:grid;place-items:center;width:${size}px;height:${size}px;border-radius:999px;background:${color};color:#f3ead9;border:2px solid #fbf6ec;font:600 ${font}px/1 Barlow,sans-serif">${label}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}
