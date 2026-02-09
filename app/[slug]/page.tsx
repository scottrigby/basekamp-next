import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { getPageBySlug, getPageSlugs } from "@/lib/pages";
import ImageSlider from "@/components/ImageSlider";

type Params = { slug: string };

export const dynamic = "force-static";

export async function generateStaticParams(): Promise<Params[]> {
  const slugs = getPageSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params> | Params;
}) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  try {
    const { meta } = getPageBySlug(slug);
    return {
      title: meta.title + " | Basekamp",
      description: meta.description,
    };
  } catch {
    return { title: "Not Found | Basekamp" };
  }
}

export default async function Page({
  params,
}: {
  params: Promise<Params> | Params;
}) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  let page;
  try {
    page = getPageBySlug(slug);
  } catch {
    return notFound();
  }

  const { meta, content } = page;
  const hasImages = meta.images && meta.images.length > 0;

  return (
    <>
      <h1>{meta.title}</h1>
      <div className={hasImages ? "sm:grid sm:grid-cols-5" : ""}>
        <div className={hasImages ? "sm:col-span-3 sm:mr-4" : ""}>
          {/* Mobile carousel */}
          {hasImages && (
            <div className="sm:hidden my-4 -mx-4">
              <ImageSlider
                images={meta.images!}
                className="flex overflow-x-auto snap-x snap-mandatory gap-2 px-4 pb-2 [&>button]:w-32 [&>button]:h-32"
              />
            </div>
          )}
          <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{content}</Markdown>
        </div>
        {/* Desktop grid */}
        {hasImages && (
          <div className="hidden sm:block sm:col-span-2">
            <ImageSlider
              images={meta.images!}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            />
          </div>
        )}
      </div>
    </>
  );
}
