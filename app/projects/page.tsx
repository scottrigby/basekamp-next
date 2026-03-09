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
      <ul className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 sm:gap-6 p-4 list-none">
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
      </ul>
    </>
  );
}
