import { Metadata } from "next";
import { getAllProjects } from "../../lib/projects";
import Card from "@/components/Card";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Projects | Basekamp",
};

export default function ProjectsIndex() {
  const projects = getAllProjects();

  return (
    <>
      <h1>Projects</h1>
      <div className="grid grid-cols-[repeat(auto-fit,_minmax(150px,_1fr))] sm:grid-cols-[repeat(auto-fit,_minmax(200px,_1fr))] gap-4 sm:gap-6 p-4">
        {projects.map(({ meta }) => (
          <Card
            key={meta.slug}
            title={meta.title}
            date={meta.date}
            slug={meta.slug}
            location={meta.location}
            attribution={meta.attribution}
            images={meta.images}
          />
        ))}
      </div>
    </>
  );
}
