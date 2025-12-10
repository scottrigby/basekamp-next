import { MetadataRoute } from "next";
import fs from "fs";
import path from "path";
import { getProjectSlugs } from "@/lib/projects";
import { getEventSlugs } from "@/lib/events";
import { getPageSlugs } from "@/lib/pages";

const BASE_URL = "https://basekamp.com";

// Map dynamic route patterns to their slug fetchers
const dynamicRoutes: Record<string, () => string[]> = {
  "projects/[slug]": getProjectSlugs,
  "events/[slug]": getEventSlugs,
  "[slug]": getPageSlugs,
};

// Routes to exclude from sitemap
const excludedRoutes = ["api"];

function scanAppRoutes(dir: string, basePath = ""): string[] {
  const routes: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip excluded directories
      if (excludedRoutes.includes(entry.name)) continue;

      // Handle route groups (parentheses) - don't add to path
      const routeSegment = entry.name.startsWith("(") ? "" : entry.name;
      const newBasePath = routeSegment
        ? basePath
          ? `${basePath}/${routeSegment}`
          : routeSegment
        : basePath;

      routes.push(...scanAppRoutes(fullPath, newBasePath));
    } else if (entry.name === "page.tsx" || entry.name === "page.ts") {
      routes.push(basePath || "/");
    }
  }

  return routes;
}

function getPriority(route: string): number {
  if (route === "/") return 1.0;
  if (route === "projects" || route === "events") return 0.9;
  if (route.includes("[")) return 0.8; // dynamic routes
  const depth = route.split("/").filter(Boolean).length;
  return Math.round(Math.max(0.5, 0.8 - depth * 0.1) * 10) / 10;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const appDir = path.join(process.cwd(), "app");
  const routes = scanAppRoutes(appDir);
  const results: MetadataRoute.Sitemap = [];

  for (const route of routes) {
    // Check if route contains dynamic segment
    if (route.includes("[")) {
      // Find matching dynamic route pattern
      const dynamicMatch = Object.keys(dynamicRoutes).find((pattern) => {
        if (pattern === "[slug]") {
          // Top-level dynamic route
          return route === "[slug]";
        }
        // Nested dynamic route (e.g., projects/[slug])
        return route === pattern;
      });

      if (dynamicMatch) {
        const getSlugs = dynamicRoutes[dynamicMatch];
        const slugs = getSlugs();
        const baseRoute = route.replace("[slug]", "").replace(/\/$/, "");

        for (const slug of slugs) {
          const url = baseRoute
            ? `${BASE_URL}/${baseRoute}/${slug}`
            : `${BASE_URL}/${slug}`;
          results.push({
            url,
            priority: getPriority(route),
          });
        }
      }
    } else {
      // Static route
      const url = route === "/" ? BASE_URL : `${BASE_URL}/${route}`;
      results.push({
        url,
        priority: getPriority(route),
      });
    }
  }

  return results;
}
