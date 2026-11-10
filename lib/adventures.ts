import fs from "node:fs";
import path from "node:path";
import { readJpegLocation } from "@/lib/jpeg-gps";
import { readJpegSize } from "@/lib/jpeg-size";
import type { Adventure, GalleryItem, Moment, RideStat } from "@/lib/types";

const CONTENT_ROOT = path.join(process.cwd(), "content", "adventures");
const PUBLIC_ROOT = path.join(process.cwd(), "public", "adventures");
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const VIDEO_EXTENSIONS = new Set([".mp4", ".mov", ".webm", ".m4v"]);
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg"]);

type Frontmatter = {
  title: string;
  location: string;
  dateLabel: string;
  summary: string;
  cover: string;
  coverAlt: string;
  order: number;
  stats: RideStat[];
};

export function listAdventures(): Adventure[] {
  if (!fs.existsSync(CONTENT_ROOT)) {
    return [];
  }

  const slugs = fs
    .readdirSync(CONTENT_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && SLUG_PATTERN.test(entry.name))
    .map((entry) => entry.name);

  return slugs
    .map((slug) => readAdventure(slug))
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

export function getAdventure(slug: string): Adventure | null {
  if (!SLUG_PATTERN.test(slug)) {
    return null;
  }
  const markdownPath = path.join(CONTENT_ROOT, slug, "adventure.md");
  if (!fs.existsSync(markdownPath)) {
    return null;
  }
  return readAdventure(slug);
}

function readAdventure(slug: string): Adventure {
  const markdownPath = path.join(CONTENT_ROOT, slug, "adventure.md");
  const raw = fs.readFileSync(markdownPath, "utf8");
  const { frontmatter, body } = splitFrontmatter(raw, markdownPath);
  const moments = parseMoments(body, slug, markdownPath);
  const cover = resolveMedia(
    slug,
    frontmatter.cover,
    frontmatter.coverAlt,
    markdownPath,
  );
  if (cover.kind !== "image") {
    throw new Error(`${markdownPath}: cover must be a JPEG`);
  }

  return {
    slug,
    title: frontmatter.title,
    location: frontmatter.location,
    dateLabel: frontmatter.dateLabel,
    summary: frontmatter.summary,
    coverSrc: cover.src,
    coverAlt: cover.alt,
    coverWidth: cover.width,
    coverHeight: cover.height,
    stats: frontmatter.stats,
    order: frontmatter.order,
    moments,
  };
}

function splitFrontmatter(raw: string, filePath: string): {
  frontmatter: Frontmatter;
  body: string;
} {
  if (!raw.startsWith("---\n")) {
    throw new Error(`${filePath}: missing frontmatter`);
  }
  const end = raw.indexOf("\n---\n", 4);
  if (end === -1) {
    throw new Error(`${filePath}: frontmatter is not closed`);
  }

  const fields = new Map<string, string>();
  const stats: RideStat[] = [];
  for (const line of raw.slice(4, end).split("\n")) {
    if (!line.trim()) {
      continue;
    }
    const separator = line.indexOf(":");
    if (separator === -1) {
      throw new Error(`${filePath}: bad frontmatter line "${line}"`);
    }
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (key === "stat") {
      const [label, ...rest] = value.split("|");
      stats.push({ label: label.trim(), value: rest.join("|").trim() });
      continue;
    }
    fields.set(key, value);
  }

  const required = ["title", "location", "dateLabel", "summary", "cover", "coverAlt"];
  for (const key of required) {
    if (!fields.get(key)) {
      throw new Error(`${filePath}: frontmatter missing ${key}`);
    }
  }

  return {
    frontmatter: {
      title: fields.get("title") ?? "",
      location: fields.get("location") ?? "",
      dateLabel: fields.get("dateLabel") ?? "",
      summary: fields.get("summary") ?? "",
      cover: fields.get("cover") ?? "",
      coverAlt: fields.get("coverAlt") ?? "",
      order: Number(fields.get("order") ?? "0"),
      stats,
    },
    body: raw.slice(end + 5),
  };
}

function parseMoments(body: string, slug: string, filePath: string): Moment[] {
  const chunks = body.split(/\n(?=## )/).map((chunk) => chunk.trim()).filter(Boolean);
  return chunks.map((chunk, index) => {
    const lines = chunk.split("\n");
    const title = lines[0].replace(/^##\s+/, "").trim();
    let day = "";
    const prose: string[] = [];
    const media: GalleryItem[] = [];

    for (const line of lines.slice(1)) {
      const dayMatch = /^day:\s*(.+)$/.exec(line.trim());
      if (dayMatch) {
        day = dayMatch[1].trim();
        continue;
      }
      const mediaMatch = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(line.trim());
      if (mediaMatch) {
        media.push(resolveMedia(slug, mediaMatch[2], mediaMatch[1], filePath));
        continue;
      }
      prose.push(line);
    }

    return {
      id: `${slug}-${index + 1}`,
      day,
      title,
      text: prose.join("\n").trim(),
      media,
    };
  });
}

function resolveMedia(
  slug: string,
  href: string,
  alt: string,
  filePath: string,
): GalleryItem {
  const filename = path.basename(href);
  if (filename !== href.trim() || filename.includes("..")) {
    throw new Error(`${filePath}: media must be a filename, got "${href}"`);
  }
  const absolute = path.join(PUBLIC_ROOT, slug, filename);
  if (!fs.existsSync(absolute)) {
    throw new Error(`${filePath}: missing media file ${filename}`);
  }

  const extension = path.extname(filename).toLowerCase();
  const src = `/adventures/${slug}/${filename}`;
  if (VIDEO_EXTENSIONS.has(extension)) {
    return { kind: "video", src, alt, width: 0, height: 0, location: null };
  }
  if (!IMAGE_EXTENSIONS.has(extension)) {
    throw new Error(`${filePath}: unsupported media ${filename}`);
  }

  const bytes = fs.readFileSync(absolute);
  const size = readJpegSize(bytes);
  return {
    kind: "image",
    src,
    alt,
    width: size.width,
    height: size.height,
    location: readJpegLocation(bytes),
  };
}
