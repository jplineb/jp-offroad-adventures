export type GeoPoint = {
  lat: number;
  lng: number;
  altitudeMeters: number | null;
  takenAt: string | null;
};

export type GalleryItem = {
  kind: "image" | "video";
  src: string;
  alt: string;
  width: number;
  height: number;
  location: GeoPoint | null;
};

export type MapStop = {
  id: string;
  sequence: number;
  momentId: string;
  title: string;
  day: string;
  lat: number;
  lng: number;
  altitudeMeters: number | null;
  takenAt: string | null;
  photoCount: number;
  coverSrc: string;
  coverAlt: string;
};

export type Moment = {
  id: string;
  day: string;
  title: string;
  text: string;
  media: GalleryItem[];
};

export type RideStat = {
  label: string;
  value: string;
};

export type Adventure = {
  slug: string;
  title: string;
  location: string;
  dateLabel: string;
  summary: string;
  coverSrc: string;
  coverAlt: string;
  coverWidth: number;
  coverHeight: number;
  stats: RideStat[];
  order: number;
  moments: Moment[];
};
