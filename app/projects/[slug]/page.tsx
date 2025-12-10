import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { getProjectBySlug, getProjectSlugs } from "../../../lib/projects";
import { formatDate } from "@/lib/utils";
import ImageSlider from "@/components/ImageSlider";

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

  return (
    <article>
      <h1 className="mb-1">{meta.title}</h1>
      <div className="sm:grid sm:grid-cols-5">
        <div className="sm:col-span-3 sm:mr-4">
          {meta.date && (
            <small className="block">{formatDate(meta.date)}</small>
          )}
          {meta.location && <small className="block">{meta.location}</small>}
          {meta.attribution && (
            <small className="block">{meta.attribution}</small>
          )}
          {/* Mobile carousel */}
          <div className="sm:hidden my-4 -mx-4">
            <ImageSlider
              images={meta.images}
              className="flex overflow-x-auto snap-x snap-mandatory gap-2 px-4 pb-2 [&>button]:w-32 [&>button]:h-32"
            />
          </div>
          <div className="mt-8 sm:mt-8">
            <Markdown rehypePlugins={[rehypeRaw]}>{content}</Markdown>
          </div>
        </div>
        {/* Desktop grid */}
        <div className="hidden sm:block sm:col-span-2">
          <ImageSlider
            images={meta.images}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          />
        </div>
      </div>
    </article>
  );
}
