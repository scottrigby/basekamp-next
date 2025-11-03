import { getAllProjects } from "../../lib/projects";
import Card from "@/components/Card";

export const dynamic = "force-static";

export default function ProjectsIndex() {
  const projects = getAllProjects();

  return (
    <main>
      <h1>Projects</h1>
      <div className="grid grid-cols-[repeat(auto-fit,_minmax(200px,_1fr))] gap-4 p-4">
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
    </main>
  );
}
