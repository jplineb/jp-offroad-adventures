import type { GalleryItem, MapStop, Moment } from "@/lib/types";

const CLUSTER_METERS = 150;

export function photoStops(moments: Moment[]): MapStop[] {
  const stops: MapStop[] = [];

  for (const moment of moments) {
    const clusters: GalleryItem[][] = [];
    for (const item of moment.media) {
      if (item.kind !== "image" || !item.location) {
        continue;
      }
      const cluster = clusters.find((candidate) => {
        const anchor = candidate[0]?.location;
        return anchor ? distanceMeters(anchor, item.location!) <= CLUSTER_METERS : false;
      });
      if (cluster) {
        cluster.push(item);
      } else {
        clusters.push([item]);
      }
    }

    clusters.forEach((cluster, index) => {
      const located = cluster.flatMap((item) => (item.location ? [item] : []));
      const earliest = located.reduce((best, item) => {
        if (!best.location?.takenAt) {
          return item;
        }
        if (!item.location?.takenAt) {
          return best;
        }
        return item.location.takenAt < best.location.takenAt ? item : best;
      });
      const cover = earliest.location ? earliest : located[0];
      if (!cover?.location) {
        return;
      }

      const lat = located.reduce((sum, item) => sum + (item.location?.lat ?? 0), 0) / located.length;
      const lng = located.reduce((sum, item) => sum + (item.location?.lng ?? 0), 0) / located.length;
      stops.push({
        id: `${moment.id}-${index + 1}`,
        sequence: 0,
        momentId: moment.id,
        title: moment.title,
        day: moment.day,
        lat: Math.round(lat * 1e6) / 1e6,
        lng: Math.round(lng * 1e6) / 1e6,
        altitudeMeters: cover.location.altitudeMeters,
        takenAt: cover.location.takenAt,
        photoCount: located.length,
        coverSrc: cover.src,
        coverAlt: cover.alt,
      });
    });
  }

  fillMissingCaptureTimes(stops);

  stops.sort((a, b) => {
    if (a.takenAt && b.takenAt && a.takenAt !== b.takenAt) {
      return a.takenAt < b.takenAt ? -1 : 1;
    }
    if (a.takenAt && !b.takenAt) {
      return -1;
    }
    if (!a.takenAt && b.takenAt) {
      return 1;
    }
    return a.momentId.localeCompare(b.momentId);
  });

  return stops.map((stop, index) => ({ ...stop, sequence: index + 1 }));
}

function fillMissingCaptureTimes(stops: MapStop[]) {
  let index = 0;
  while (index < stops.length) {
    if (stops[index]?.takenAt) {
      index += 1;
      continue;
    }
    const start = index;
    while (index < stops.length && !stops[index]?.takenAt) {
      index += 1;
    }
    const previous = start > 0 ? stops[start - 1]?.takenAt ?? null : null;
    const next = index < stops.length ? stops[index]?.takenAt ?? null : null;
    const count = index - start;
    for (let offset = 0; offset < count; offset += 1) {
      const stop = stops[start + offset];
      if (!stop) {
        continue;
      }
      stop.takenAt = approximateCaptureTime(previous, next, offset, count);
    }
  }
}

function approximateCaptureTime(
  previous: string | null,
  next: string | null,
  offset: number,
  count: number,
): string | null {
  const previousMillis = timestampToMillis(previous);
  const nextMillis = timestampToMillis(next);
  if (previousMillis !== null && nextMillis !== null) {
    const sameDay = previous?.slice(0, 10) === next?.slice(0, 10);
    if (sameDay && nextMillis > previousMillis) {
      const step = Math.max(1_000, Math.floor((nextMillis - previousMillis) / (count + 1)));
      return millisToTimestamp(previousMillis + step * (offset + 1));
    }
    return millisToTimestamp(previousMillis + 60_000 * (offset + 1));
  }
  if (previousMillis !== null) {
    return millisToTimestamp(previousMillis + 60_000 * (offset + 1));
  }
  if (nextMillis !== null) {
    return millisToTimestamp(nextMillis - 60_000 * (count - offset));
  }
  return null;
}

function timestampToMillis(value: string | null): number | null {
  if (!value) {
    return null;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/.exec(value);
  if (!match) {
    return null;
  }
  return Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    Number(match[6]),
  );
}

function millisToTimestamp(value: number): string {
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}

function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const earth = 6_371_000;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earth * Math.asin(Math.min(1, Math.sqrt(h)));
}
