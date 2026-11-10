"use client";

import { useEffect, useRef, useState } from "react";
import type { MapStop } from "@/lib/types";
import "leaflet/dist/leaflet.css";

type StoryMapProps = {
  stops: MapStop[];
  numbers: Map<string, number>;
  activeMomentId: string | null;
  onSelect: (momentId: string) => void;
};

type PlacedPin = {
  stop: MapStop;
  marker: import("leaflet").Marker;
};

type MapTarget = {
  bounds: import("leaflet").LatLngBounds;
  maxZoom: number;
};

export function StoryMap({ stops, numbers, activeMomentId, onSelect }: StoryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const pinsRef = useRef<PlacedPin[]>([]);
  const targetRef = useRef<MapTarget | null>(null);
  const onSelectRef = useRef(onSelect);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || stops.length === 0) {
      return;
    }

    let active = true;
    let resizeObserver: ResizeObserver | undefined;

    const mount = async () => {
      const leaflet = await import("leaflet");
      if (!active) {
        return;
      }

      const map = leaflet.map(container, {
        scrollWheelZoom: false,
        dragging: !leaflet.Browser.mobile,
        attributionControl: true,
        zoomControl: false,
      });
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
        if (targetRef.current) {
          fitTarget(map, targetRef.current, false);
        }
      });
      resizeObserver.observe(container);
      leaflet.control.zoom({ position: "bottomright" }).addTo(map);
      leaflet
        .tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
          attribution:
            'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
          subdomains: "abc",
          maxZoom: 17,
        })
        .addTo(map);

      const positions = stops.map((stop) => [stop.lat, stop.lng] as [number, number]);
      leaflet
        .polyline(positions, { color: "#1b332b", weight: 3, opacity: 0.7, dashArray: "6 6" })
        .addTo(map);

      pinsRef.current = stops.map((stop) => {
        const marker = leaflet.marker([stop.lat, stop.lng], {
          icon: storyPin(leaflet, numbers.get(stop.momentId), false),
          alt: stop.title,
          zIndexOffset: stop.sequence,
        });
        marker.on("click", () => onSelectRef.current(stop.momentId));
        marker.addTo(map);
        return { stop, marker };
      });

      map.fitBounds(positions, { padding: [40, 40], maxZoom: 12 });
      mapRef.current = map;
      leafletRef.current = leaflet;
      setReady(true);
    };

    void mount();

    return () => {
      active = false;
      resizeObserver?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
      pinsRef.current = [];
      setReady(false);
    };
  }, [stops, numbers]);

  useEffect(() => {
    const map = mapRef.current;
    const leaflet = leafletRef.current;
    if (!ready || !map || !leaflet) {
      return;
    }

    const activePins = pinsRef.current.filter((pin) => pin.stop.momentId === activeMomentId);
    for (const pin of pinsRef.current) {
      const isActive = pin.stop.momentId === activeMomentId;
      pin.marker.setIcon(storyPin(leaflet, numbers.get(pin.stop.momentId), isActive));
      pin.marker.setZIndexOffset(isActive ? 1000 : pin.stop.sequence);
    }

    const targets = activePins.length > 0 ? activePins.map((pin) => pin.stop) : stops;
    const target = {
      bounds: leaflet.latLngBounds(targets.map((stop) => [stop.lat, stop.lng])),
      maxZoom: activePins.length > 0 ? 12 : 11,
    };
    targetRef.current = target;
    fitTarget(map, target, true);
  }, [activeMomentId, ready, stops, numbers]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full bg-paper-deep"
      role="region"
      aria-label="Map of the ride, following the stop you are reading"
    />
  );
}

function fitTarget(map: import("leaflet").Map, target: MapTarget, animate: boolean) {
  const size = map.getSize();
  if (size.y < 120) {
    return;
  }
  const padding = Math.round(Math.min(60, size.x / 6, size.y / 6));
  const options = { padding: [padding, padding] as [number, number], maxZoom: target.maxZoom };
  if (animate) {
    map.flyToBounds(target.bounds, { ...options, duration: 0.9 });
  } else {
    map.fitBounds(target.bounds, { ...options, animate: false });
  }
}

function storyPin(
  leaflet: typeof import("leaflet"),
  number: number | undefined,
  active: boolean,
): import("leaflet").DivIcon {
  const size = active ? 36 : 22;
  const font = active ? 13 : 9;
  const background = active ? "#c65a2e" : "#1b332b";
  const opacity = active ? 1 : 0.7;
  const ring = active ? "0 0 0 6px rgb(198 90 46 / 0.25)" : "none";
  return leaflet.divIcon({
    className: "ride-pin",
    html: `<span style="display:grid;place-items:center;width:${size}px;height:${size}px;border-radius:999px;background:${background};opacity:${opacity};box-shadow:${ring};color:#f3ead9;border:2px solid #fbf6ec;font:600 ${font}px/1 Barlow,sans-serif;transition:all .2s">${number ?? ""}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}
