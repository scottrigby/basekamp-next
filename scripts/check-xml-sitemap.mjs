// scripts/check-xml-sitemap.mjs
// Usage: node scripts/check-xml-sitemap.mjs
// Outputs:
//   nodes.csv    → /node/N,Title,node-type-*
//   aliased.csv  → /path,status,[location],[finalStatus]
//   missing.csv  → subset of nodes.csv rows with missing title or node-type (only emitted if any)
// Prints counts to stdout.

import fs from "fs";
import path from "path";
import { setTimeout as delay } from "timers/promises";
import { XMLParser } from "fast-xml-parser";

// Install: npm i fast-xml-parser

const SITEMAP_URL = 'http://basekamp.com/sitemap.xml';     // XML sitemap
const COM_DOMAIN = 'http://basekamp.com';                  // enrichment target (no TLS)
const NETLIFY_DOMAIN = 'https://basekamp.netlify.app';     // aliased check target (TLS)

// CSV-safe field
function csvField(s) {
  const v = (s ?? "").toString();
  return /[,"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

// Normalize URL → path-only
function toPathOnly(urlOrPath) {
  if (!urlOrPath) return "";
  let u = urlOrPath.trim().replace(/^https?:\/\/[^/]+/i, "");
  if (!u.startsWith("/")) u = "/" + u;
  u = u.replace(/\/{2,}/g, "/");
  if (u.length > 1 && u.endsWith("/")) u = u.slice(0, -1);
  return u;
}

function isNonAliasedNodePath(p) {
  return /^\/node\/\d+$/i.test(p);
}

async function fetchText(url) {
  const res = await fetch(url, { redirect: "manual" });
  const text = await res.text();
  return { status: res.status, headers: res.headers, text };
}

// Parse XML sitemap via fast-xml-parser
async function getAllPathsFromXmlSitemap() {
  const { status, text } = await fetchText(SITEMAP_URL);
  if (status !== 200) {
    throw new Error(`Sitemap fetch got status ${status} from ${SITEMAP_URL}`);
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true, // so urlset/url/loc parse cleanly regardless of namespace prefixes
    trimValues: true,
  });
  const doc = parser.parse(text);

  // doc.urlset.url can be an array or a single object
  const urls = Array.isArray(doc?.urlset?.url)
    ? doc.urlset.url
    : doc?.urlset?.url
    ? [doc.urlset.url]
    : [];
  const locs = urls.map((u) => u?.loc).filter(Boolean);

  const seen = new Set();
  const paths = [];
  for (const loc of locs) {
    const p = toPathOnly(loc);
    if (p && !seen.has(p)) {
      seen.add(p);
      paths.push(p);
    }
  }

  console.log(
    `Sitemap fetch OK (status ${status}). loc entries found: ${locs.length}. unique paths: ${paths.length}`
  );
  return paths;
}

// Enrich /node/N from basekamp.com → H1.title and node-type-* from body class
async function enrichNodePath(nodePath) {
  const url = COM_DOMAIN + nodePath;
  const res = await fetch(url, { redirect: "manual" });
  const html = await res.text();

  // Regex-based extraction (fast, no extra deps)
  const titleMatch = html.match(
    /<h1[^>]*class=["'][^"']*title[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i
  );
  const title = titleMatch ? decodeHtml(stripTags(titleMatch[1]).trim()) : "";

  const bodyClassMatch = html.match(/<body[^>]*class=["']([^"']+)["'][^>]*>/i);
  const bodyClass = bodyClassMatch ? bodyClassMatch[1] : "";
  const nodeTypeMatch = bodyClass.match(/node-type-[\w-]+/i);
  const nodeType = nodeTypeMatch ? nodeTypeMatch[0] : "";

  return { title, nodeType };
}

function decodeHtml(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}

function stripTags(s) {
  return s.replace(/<[^>]+>/g, "");
}

function normalizeLocation(loc) {
  if (!loc) return "";
  const pathOnly = toPathOnly(loc);
  return pathOnly || loc.trim();
}

// Check aliased path against Netlify, include one-level redirect follow
async function checkAliasedOnNetlify(aliasedPath) {
  const res1 = await fetch(NETLIFY_DOMAIN + aliasedPath, {
    redirect: "manual",
  });
  const status1 = res1.status;
  let location = "";
  let finalStatus = "";

  if (status1 === 301 || status1 === 302) {
    const rawLoc = res1.headers.get("location") || "";
    location = normalizeLocation(rawLoc);
    if (location) {
      const res2 = await fetch(NETLIFY_DOMAIN + location, {
        redirect: "manual",
      });
      finalStatus = String(res2.status);
    }
  }

  return { status1: String(status1), location, finalStatus };
}

// Bounded concurrency helper
async function runBatched(items, limit, fn) {
  const results = new Array(items.length);
  let i = 0;
  const workers = new Array(Math.min(limit, items.length))
    .fill(0)
    .map(async () => {
      while (i < items.length) {
        const idx = i++;
        try {
          results[idx] = await fn(items[idx], idx);
        } catch {
          results[idx] = null;
        }
        await delay(0);
      }
    });
  await Promise.all(workers);
  return results;
}

function inc(map, key) {
  map.set(key, (map.get(key) || 0) + 1);
}

function printHistogram(title, map) {
  const entries = Array.from(map.entries()).sort((a, b) => {
    const an = Number(a[0]),
      bn = Number(b[0]);
    if (!Number.isNaN(an) && !Number.isNaN(bn)) return an - bn;
    return String(a[0]).localeCompare(String(b[0]));
  });
  console.log(`- ${title}:`);
  if (!entries.length) {
    console.log("  (none)");
    return;
  }
  for (const [k, v] of entries) {
    console.log(`  ${k}: ${v}`);
  }
}

function splitCsvRow(row) {
  const parts = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
    } else if (ch === "," && !inQuotes) {
      parts.push(unquote(current));
      current = "";
    } else {
      current += ch;
    }
  }
  parts.push(unquote(current));
  return parts;
}

function unquote(s) {
  const trimmed = s.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/""/g, '"');
  }
  return trimmed;
}

(async function main() {
  const allPaths = await getAllPathsFromXmlSitemap();
  const totalCount = allPaths.length;

  const nodePaths = allPaths.filter(isNonAliasedNodePath);
  const aliasedPaths = allPaths.filter((p) => !isNonAliasedNodePath(p));

  const NODE_CONCURRENCY = 8;
  const NETLIFY_CONCURRENCY = 12;

  // Counters for node enrichment
  let missingTitleCount = 0;
  let missingNodeTypeCount = 0;

  // nodes.csv: /node/N,Title,node-type-*
  const nodeRows = await runBatched(nodePaths, NODE_CONCURRENCY, async (p) => {
    try {
      const { title, nodeType } = await enrichNodePath(p);
      if (!title) missingTitleCount++;
      if (!nodeType) missingNodeTypeCount++;
      return [csvField(p), csvField(title), csvField(nodeType)].join(",");
    } catch {
      missingTitleCount++;
      missingNodeTypeCount++;
      return [csvField(p), "", ""].join(",");
    }
  });
  fs.writeFileSync(
    path.join(process.cwd(), "nodes.csv"),
    nodeRows.join("\n") + "\n",
    "utf8"
  );

  // missing.csv: rows with missing title or node-type
  const missingRows = nodeRows.filter((row) => {
    const parts = splitCsvRow(row);
    const title = parts[1] ?? "";
    const nodeType = parts[2] ?? "";
    return title === "" || nodeType === "";
  });
  if (missingRows.length > 0) {
    fs.writeFileSync(
      path.join(process.cwd(), "missing.csv"),
      missingRows.join("\n") + "\n",
      "utf8"
    );
  }

  // aliased.csv: /path,status,[location],[finalStatus]
  const statusCounts = new Map(); // status1 histogram
  const redirectFinalCounts = new Map(); // finalStatus histogram for 301/302 locations

  const aliasedResults = await runBatched(
    aliasedPaths,
    NETLIFY_CONCURRENCY,
    async (p) => {
      try {
        const { status1, location, finalStatus } = await checkAliasedOnNetlify(
          p
        );
        inc(statusCounts, status1);
        if (status1 === "301" || status1 === "302") {
          if (finalStatus) inc(redirectFinalCounts, finalStatus);
          return [
            csvField(p),
            csvField(status1),
            csvField(location),
            csvField(finalStatus),
          ].join(",");
        }
        return [csvField(p), csvField(status1), "", ""].join(",");
      } catch {
        inc(statusCounts, "error");
        return [csvField(p), "", "", ""].join(",");
      }
    }
  );

  fs.writeFileSync(
    path.join(process.cwd(), "aliased.csv"),
    aliasedResults.join("\n") + "\n",
    "utf8"
  );

  // Metrics to stdout
  console.log(`Total URLs recorded: ${totalCount}`);
  console.log(`Non-aliased node paths processed: ${nodePaths.length}`);
  console.log(`Aliased paths processed: ${aliasedPaths.length}`);
  console.log(`Missing H1.title in node enrichments: ${missingTitleCount}`);
  console.log(
    `Missing node-type-* in node enrichments: ${missingNodeTypeCount}`
  );
  printHistogram("Aliased status codes (first request)", statusCounts);
  printHistogram(
    "Redirect location final status codes (for 301/302)",
    redirectFinalCounts
  );
})();
