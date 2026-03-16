import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getAllProjects } from "@/lib/projects";
import { getAllEvents } from "@/lib/events";
import { getAllPages } from "@/lib/pages";

export const metadata: Metadata = {
  title: "Basekamp site map",
};

export default function SitemapPage() {
  const projects = getAllProjects();
  const events = getAllEvents();
  const pages = getAllPages();

  return (
    <>
      <h1>Basekamp site map</h1>
      <div className="sm:grid sm:grid-cols-8">
        <div className="sm:col-span-5 sm:mr-4">
          <p>
            This page provides a complete guide to all content on the Basekamp
            website.
          </p>

          <nav>
            <ul>
              <li>
                <Link href="/">About</Link>
              </li>
              <li>
                <Link href="/contact">Contact</Link>
              </li>

              {pages.map((page) => (
                <li key={page.meta.slug}>
                  <Link href={`/${page.meta.slug}`}>{page.meta.title}</Link>
                </li>
              ))}

              <li>
                <Link href="/projects">Projects</Link>
                {projects.length > 0 && (
                  <ul>
                    {projects.map((project) => (
                      <li key={project.meta.slug}>
                        <Link href={`/projects/${project.meta.slug}`}>
                          {project.meta.title}
                        </Link>
                        {project.meta.date && (
                          <span className="text-gray-600 ml-2">
                            ({new Date(project.meta.date).getFullYear()})
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>

              <li>
                <Link href="/events">Events</Link>
                {events.length > 0 && (
                  <ul>
                    {events.map((event) => (
                      <li key={event.meta.slug}>
                        <Link href={`/events/${event.meta.slug}`}>
                          {event.meta.title}
                        </Link>
                        {event.meta.dateRange && (
                          <span className="text-gray-600 ml-2">
                            ({new Date(event.meta.dateRange.from).getFullYear()}
                            )
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            </ul>
          </nav>
        </div>
        <div className="sm:col-span-3">
          <Image
            width={600}
            height={450}
            src="/1_1.jpg"
            alt="Documentation photograph of map from Walk Talk Eat TalkSomeMore project, Co-organized by Basekamp & c.cred, multiple locations, 2006"
          />
        </div>
      </div>
    </>
  );
}
