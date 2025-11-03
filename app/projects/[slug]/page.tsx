import { notFound } from "next/navigation";
import { marked } from "marked";
import { getProjectBySlug, getProjectSlugs } from "../../../lib/projects";
import { formatDate } from "@/lib/utils";
import Image from "next/image";

type Params = { slug: string };

export const dynamic = "force-static";

export async function generateStaticParams(): Promise<Params[]> {
  const slugs = getProjectSlugs();
  return slugs.map((slug) => ({ slug }));
}

async function fetchProjectData(params: Promise<Params> | Params) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  let project;
  try {
    project = getProjectBySlug(slug);
  } catch {
    return notFound();
  }

  return project;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params> | Params;
}) {
  const { meta } = await fetchProjectData(params);

  return {
    title: meta.title + " | Basekamp",
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<Params> | Params;
}) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  let project;
  try {
    project = getProjectBySlug(slug);
  } catch {
    return notFound();
  }

  const { meta, content } = project;
  const html = marked.parse(content);

  return (
    <article>
      <h1 className="mb-1">{meta.title}</h1>
      <div className="sm:grid sm:grid-cols-5">
        <div className="sm:col-span-4 sm:mr-4">
          {meta.date && (
            <small className="block">{formatDate(meta.date)}</small>
          )}
          {meta.location && <small className="block">{meta.location}</small>}
          {meta.attribution && (
            <small className="block">{meta.attribution}</small>
          )}
          <div dangerouslySetInnerHTML={{ __html: html }} className="mt-8" />
        </div>
        <div className="sm:col-span-1">
          <div className="size-50 aspect-square">
            {meta.images.map(({ src, alt }) => (
              <Image
                key={src}
                src={`/${src}`}
                alt={alt}
                width={200}
                height={200}
                className="object-cover w-full h-full mb-4"
              />
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
