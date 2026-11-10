# JP Offroad Adventures

Ride notes for off-road motorcycle trips. Lake Tahoe is the first ride.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy on Vercel

Import this repo. The framework preset is Next.js. Use the default `npm run build`. No environment variables.

## Add an adventure

1. Create `content/adventures/<slug>/adventure.md`.
2. Put JPEGs and videos in `public/adventures/<slug>/`.
3. Link media by filename only: `![Caption](photo.jpg)`.

Copy `content/adventures/lake-tahoe/adventure.md`. Frontmatter holds the title, date, summary, cover, and stats. Each `##` heading is a timeline stop. A `day:` line under the heading is the sequence label. Photos and videos listed under that heading belong to the stop. JPEGs that still have GPS metadata are plotted on the ride map in the order they were taken.

Keep photos as JPEG, long edge around 2400px. Leave video files as-is (mp4 or mov).
