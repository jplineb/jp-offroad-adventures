import type { GeoPoint } from "@/lib/types";

type IfdEntry = {
  type: number;
  count: number;
  value: number;
  inlineOffset: number;
};

const EXIF_POINTER = 0x8769;
const GPS_POINTER = 0x8825;
const DATE_TIME = 0x0132;
const DATE_TIME_ORIGINAL = 0x9003;

export function readJpegLocation(data: Buffer): GeoPoint | null {
  if (data.length < 4 || data[0] !== 0xff || data[1] !== 0xd8) {
    return null;
  }

  let offset = 2;
  while (offset + 4 < data.length) {
    if (data[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = data[offset + 1];
    if (marker === 0xda || marker === 0xd9) {
      break;
    }
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }

    const length = data.readUInt16BE(offset + 2);
    if (marker === 0xe1) {
      const payload = data.subarray(offset + 4, offset + 2 + length);
      if (payload.subarray(0, 6).toString("ascii") === "Exif\u0000\u0000") {
        const point = readExifGps(payload.subarray(6));
        if (point) {
          return point;
        }
      }
    }
    offset += 2 + length;
  }

  return null;
}

function readExifGps(tiff: Buffer): GeoPoint | null {
  if (tiff.length < 8) {
    return null;
  }

  const little = tiff[0] === 0x49 && tiff[1] === 0x49;
  const big = tiff[0] === 0x4d && tiff[1] === 0x4d;
  if (!little && !big) {
    return null;
  }

  const u16 = (index: number) => (little ? tiff.readUInt16LE(index) : tiff.readUInt16BE(index));
  const u32 = (index: number) => (little ? tiff.readUInt32LE(index) : tiff.readUInt32BE(index));
  const ifd0 = readIfd(tiff, u32(4), u16, u32);
  const gpsPointer = ifd0.get(GPS_POINTER);
  if (!gpsPointer) {
    return null;
  }

  const exifPointer = ifd0.get(EXIF_POINTER);
  const exif = exifPointer ? readIfd(tiff, exifPointer.value, u16, u32) : new Map<number, IfdEntry>();
  const takenAt = toTimestamp(
    readAscii(tiff, exif.get(DATE_TIME_ORIGINAL)) ??
      readAscii(tiff, exif.get(DATE_TIME)) ??
      readAscii(tiff, ifd0.get(DATE_TIME)),
  );

  const gps = readIfd(tiff, gpsPointer.value, u16, u32);
  const latitude = readRationals(tiff, gps.get(2), little);
  const longitude = readRationals(tiff, gps.get(4), little);
  if (!latitude || !longitude || latitude.length < 3 || longitude.length < 3) {
    return null;
  }

  let lat = latitude[0] + latitude[1] / 60 + latitude[2] / 3600;
  let lng = longitude[0] + longitude[1] / 60 + longitude[2] / 3600;
  if (readAscii(tiff, gps.get(1)) === "S") {
    lat = -lat;
  }
  if (readAscii(tiff, gps.get(3)) === "W") {
    lng = -lng;
  }

  const altitudeValues = readRationals(tiff, gps.get(6), little);
  let altitudeMeters = altitudeValues ? altitudeValues[0] : null;
  const altitudeRef = gps.get(5);
  if (altitudeMeters !== null && altitudeRef && tiff[altitudeRef.inlineOffset] === 1) {
    altitudeMeters = -altitudeMeters;
  }

  return {
    lat: round(lat, 6),
    lng: round(lng, 6),
    altitudeMeters: altitudeMeters === null ? null : round(altitudeMeters, 1),
    takenAt,
  };
}

function readIfd(
  tiff: Buffer,
  offset: number,
  u16: (index: number) => number,
  u32: (index: number) => number,
): Map<number, IfdEntry> {
  const entries = new Map<number, IfdEntry>();
  if (offset + 2 > tiff.length) {
    return entries;
  }
  const count = u16(offset);
  for (let index = 0; index < count; index += 1) {
    const entry = offset + 2 + index * 12;
    if (entry + 12 > tiff.length) {
      break;
    }
    entries.set(u16(entry), {
      type: u16(entry + 2),
      count: u32(entry + 4),
      value: u32(entry + 8),
      inlineOffset: entry + 8,
    });
  }
  return entries;
}

function readRationals(tiff: Buffer, entry: IfdEntry | undefined, little: boolean): number[] | null {
  if (!entry || entry.count === 0) {
    return null;
  }
  const offset = entry.count * 8 <= 4 ? entry.inlineOffset : entry.value;
  const values: number[] = [];
  for (let index = 0; index < entry.count; index += 1) {
    const cursor = offset + index * 8;
    if (cursor + 8 > tiff.length) {
      return null;
    }
    const numerator = little ? tiff.readUInt32LE(cursor) : tiff.readUInt32BE(cursor);
    const denominator = little ? tiff.readUInt32LE(cursor + 4) : tiff.readUInt32BE(cursor + 4);
    values.push(denominator === 0 ? 0 : numerator / denominator);
  }
  return values;
}

function readAscii(tiff: Buffer, entry: IfdEntry | undefined): string | null {
  if (!entry || entry.count === 0) {
    return null;
  }
  const offset = entry.count <= 4 ? entry.inlineOffset : entry.value;
  if (offset + entry.count > tiff.length) {
    return null;
  }
  const text = tiff.subarray(offset, offset + entry.count).toString("ascii").replace(/\0+$/, "");
  return text.length > 0 ? text : null;
}

function toTimestamp(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const match = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(value);
  if (!match) {
    return null;
  }
  return `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}`;
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
