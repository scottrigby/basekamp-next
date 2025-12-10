import fs from "fs";
import path from "path";
import matter from "gray-matter";

export type PageMeta = {
  title: string;
  slug: string;
  description?: string;
  images?: { src: string; alt: string }[];
};

const contentDir = path.join(process.cwd(), "content", "pages");

export function getPageSlugs(): string[] {
  if (!fs.existsSync(contentDir)) return [];
  return fs
    .readdirSync(contentDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

export function getPageBySlug(slug: string) {
  const fullPath = path.join(contentDir, `${slug}.md`);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Page not found: ${slug}`);
  }
  const file = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(file);

  const meta: PageMeta = {
    title: (data.title as string) ?? slug,
    slug: (data.slug as string) ?? slug,
    description: data.description as string | undefined,
    images: data.images as { src: string; alt: string }[] | undefined,
  };

  return { meta, content };
}

export function getAllPages(): { meta: PageMeta; content: string }[] {
  return getPageSlugs().map((slug) => getPageBySlug(slug));
}
