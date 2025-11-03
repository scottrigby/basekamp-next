import fs from "fs";
import path from "path";
import matter from "gray-matter";

export type ProjectMeta = {
  title: string;
  date: string; // ISO string
  location: string;
  attribution: string;
  slug: string;
  images: [{ src: string; alt: string }];
};

const contentDir = path.join(process.cwd(), "content", "projects");

export function getProjectSlugs(): string[] {
  return fs
    .readdirSync(contentDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

export function getProjectBySlug(slug: string) {
  const fullPath = path.join(contentDir, `${slug}.md`);
  const file = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(file);

  const finalSlug = (data.slug as string) || slug;

  // Normalize to ISO string to avoid React Date object issues
  const isoDate =
    typeof data.date === "string"
      ? new Date(data.date).toISOString()
      : data.date instanceof Date
      ? data.date.toISOString()
      : "";

  const meta: ProjectMeta = {
    title: (data.title as string) ?? finalSlug,
    date: isoDate,
    location: data.location,
    attribution: data.attribution,
    slug: finalSlug,
    images: data.images,
  };

  return { meta, content };
}

export function getAllProjects(): { meta: ProjectMeta; content: string }[] {
  return getProjectSlugs()
    .map((slug) => getProjectBySlug(slug))
    .sort((a, b) => (a.meta.date > b.meta.date ? -1 : 1));
}
