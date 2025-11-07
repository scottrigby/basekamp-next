import fs from "fs";
import path from "path";
import matter from "gray-matter";

export type EventMeta = {
  title: string;
  images: [{ src: string; alt: string }];
  dateRange: { from: string; to: string }; // ISO strings
  // location: string;
  // attribution: string;
  slug: string;
};

const contentDir = path.join(process.cwd(), "content", "events");

export function getEventSlugs(): string[] {
  return fs
    .readdirSync(contentDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

export function getEventBySlug(slug: string) {
  const fullPath = path.join(contentDir, `${slug}.md`);
  const file = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(file);

  const finalSlug = (data.slug as string) || slug;

  // Normalize to ISO string to avoid React Date object issues
  const isoDateFrom =
    typeof data.dateRange.from === "string"
      ? new Date(data.dateRange.from).toISOString()
      : data.dateRange.from instanceof Date
      ? data.dateRange.from.toISOString()
      : "";
  const isoDateTo =
    typeof data.dateRange.to === "string"
      ? new Date(data.dateRange.to).toISOString()
      : data.dateRange.to instanceof Date
      ? data.dateRange.to.toISOString()
      : "";

  const meta: EventMeta = {
    title: (data.title as string) ?? finalSlug,
    images: data.images,
    dateRange: { from: data.dateRange.from, to: data.dateRange.to },
    // location: data.location,
    // attribution: data.attribution,
    slug: finalSlug,
  };

  return { meta, content };
}

export function getAllEvents(): { meta: EventMeta; content: string }[] {
  return (
    getEventSlugs()
      .map((slug) => getEventBySlug(slug))
      // Sort by from I guess
      .sort((a, b) => (a.meta.dateRange.from > b.meta.dateRange.from ? -1 : 1))
  );
}
