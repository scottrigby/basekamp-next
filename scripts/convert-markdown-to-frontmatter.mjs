// filename: scripts/convert-markdown-to-frontmatter.mjs
// Usage:
//   node scripts/convert-markdown-to-frontmatter.mjs <sourceDir> <outputDir> <contentType> [downloadDir]
// contentType: "projects" | "events"

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import https from "node:https";
import http from "node:http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

const MONTHS = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

function normalizeLine(line) {
  return line.replace(/\r/g, "").trim();
}

// Parse "Month D, YYYY"
function parseSingleDate(raw) {
  if (!raw) return null;
  const cleaned = raw.replace(/\(.*?\)/g, "").trim();
  const m = cleaned.match(
    /^\s*([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?,\s*(\d{4})\s*$/
  );
  if (!m) return null;
  const month = MONTHS[m[1].toLowerCase()];
  const day = parseInt(m[2], 10);
  const year = parseInt(m[3], 10);
  if (!month || isNaN(day) || isNaN(year)) return null;
  return { year, month, day };
}

function formatISODate({ year, month, day }) {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

// Parse times like "6pm", "6:00pm", "12:30 AM"
function parseTime(raw) {
  if (!raw) return null;
  const s = raw.trim().toLowerCase();
  const m = s.match(/^(\d{1,2})(?::(\d{2}))?\s*([ap])m$/i);
  if (!m) return null;
  let hour = parseInt(m[1], 10);
  const minute = m[2] ? parseInt(m[2], 10) : 0;
  const ap = m[3];
  if (hour === 12) {
    hour = ap === "a" ? 0 : 12;
  } else {
    hour = ap === "p" ? hour + 12 : hour;
  }
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return `${hh}:${mm}`;
}

// Events date line parser (dates + optional times)
function parseEventsDateLine(line) {
  const parts = normalizeLine(line)
    .split(" - ")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return { dateRange: { from: "", to: "" } };

  const dateCandidates = [];
  const timeCandidates = [];
  for (const p of parts) {
    const d = parseSingleDate(p);
    if (d) {
      dateCandidates.push(d);
    } else {
      const t = parseTime(p);
      if (t) timeCandidates.push(t);
    }
  }

  const fromDate = dateCandidates[0] || null;
  const toDate = dateCandidates[1] || null;
  const fromIsoDate = fromDate ? formatISODate(fromDate) : "";
  const toIsoDate = toDate ? formatISODate(toDate) : fromIsoDate || "";

  const fromTime = timeCandidates[0] || null;
  const toTime = timeCandidates[1] || null;

  const from = fromIsoDate
    ? fromTime
      ? `${fromIsoDate}T${fromTime}`
      : fromIsoDate
    : "";
  const to = toIsoDate
    ? toTime
      ? `${toIsoDate}T${toTime}`
      : timeCandidates.length
      ? `${toIsoDate}T${fromTime || "00:00"}`
      : toIsoDate
    : "";

  return { dateRange: { from, to } };
}

// Projects date line parser (previous behavior)
function parseProjectsDateLine(line) {
  const normalized = normalizeLine(line);
  if (normalized.includes(" - ")) {
    const [fromRaw, toRaw] = normalized.split(" - ").map((s) => s.trim());
    const from = parseSingleDate(fromRaw);
    const to = parseSingleDate(toRaw);
    const date = from ? formatISODate(from) : "";
    const dateRange = {
      from: from ? formatISODate(from) : "",
      to: to ? formatISODate(to) : "",
    };
    return { date, dateRange };
  } else {
    const d = parseSingleDate(normalized);
    const date = d ? formatISODate(d) : "";
    return { date, dateRange: { from: date, to: "" } };
  }
}

// Robust image link parser:
// [![ALT](innerImageUrl)](outerUrl ["optional title"])
// We only need ALT and outerUrl; ignore title.
function parseImageLink(line) {
  const s = normalizeLine(line);

  // Quick reject if not starting with expected pattern
  if (!s.startsWith("[![")) return null;

  // ALT
  const altStart = s.indexOf("[![") + 3;
  const altEnd = s.indexOf("]]", altStart); // this would be wrong; use proper bracket finding
  // Instead, find alt up to the next "]("
  const altClose = s.indexOf("](", altStart);
  if (altClose === -1) return null;
  const alt = s.slice(altStart, altClose);

  // inner image url: starts after '(' following the previous altClose
  const innerParenOpen = s.indexOf("(", altClose);
  if (innerParenOpen === -1) return null;
  const innerParenClose = s.indexOf(")", innerParenOpen);
  if (innerParenClose === -1) return null;

  // outer link: starts at "](" after inner ), then URL up to next space or ) if no title
  const outerOpenMarker = s.indexOf("](", innerParenClose);
  if (outerOpenMarker === -1) return null;
  const outerParenOpen = outerOpenMarker + 1; // points to '('
  // URL may be followed by space then quoted title before ')'
  const outerParenClose = s.lastIndexOf(")");
  if (outerParenClose === -1 || outerParenClose < outerParenOpen) return null;

  // Extract the content inside outer parens, split into URL + optional title
  const outerContent = s.slice(outerParenOpen + 1, outerParenClose).trim();
  // If outerContent contains a quoted title, split at first space before quote
  // e.g. 'http://... "http://..."'
  let href = outerContent;
  const quoteIdx = outerContent.indexOf('"');
  if (quoteIdx > 0) {
    href = outerContent.slice(0, quoteIdx).trim();
    // const title = outerContent.slice(quoteIdx).trim().replace(/^"+|"+$/g, '');
    // we ignore title
  }

  if (!href) return null;
  return { alt: alt.trim(), href: href.trim() };
}

function escapeYamlScalar(value) {
  if (value == null) return '""';
  const s = String(value);
  if (s.length === 0) return '""';
  const needsQuotes =
    /[:]\s/.test(s) ||
    /^[\-\?\:\[\]\{\}\#\&\*\!\|>\'\"%@`]/.test(s) ||
    /[\n\r]/.test(s);
  if (needsQuotes) {
    const escaped = s.replace(/"/g, '\\"');
    return `"${escaped}"`;
  }
  return s;
}

function buildFrontmatterProjects({
  title,
  date,
  location,
  attribution,
  images,
  dateRange,
}) {
  let yaml = "---\n";
  yaml += `title: ${escapeYamlScalar(title)}\n`;
  yaml += `date: ${escapeYamlScalar(date)}\n`;
  yaml += `location: ${escapeYamlScalar(location)}\n`;
  yaml += `attribution: ${escapeYamlScalar(attribution)}\n`;
  yaml += "images:\n";
  for (const img of images) {
    yaml += `  - src: ${escapeYamlScalar(img.src)}\n`;
    yaml += `    alt: ${escapeYamlScalar(img.alt)}\n`;
  }
  yaml += "dateRange:\n";
  yaml += `  from: ${escapeYamlScalar(dateRange.from)}\n`;
  yaml += `  to: ${escapeYamlScalar(dateRange.to)}\n`;
  yaml += "---\n";
  return yaml;
}

function buildFrontmatterEvents({ title, images, dateRange }) {
  let yaml = "---\n";
  yaml += `title: ${escapeYamlScalar(title)}\n`;
  yaml += "images:\n";
  for (const img of images) {
    yaml += `  - src: ${escapeYamlScalar(img.src)}\n`;
    yaml += `    alt: ${escapeYamlScalar(img.alt)}\n`;
  }
  yaml += "dateRange:\n";
  yaml += `  from: ${escapeYamlScalar(dateRange.from)}\n`;
  yaml += `  to: ${escapeYamlScalar(dateRange.to)}\n`;
  yaml += "---\n";
  return yaml;
}

function getFilenameFromUrl(urlStr) {
  try {
    const u = new URL(urlStr);
    const base = path.basename(decodeURIComponent(u.pathname));
    return base || "image";
  } catch {
    return path.basename(urlStr);
  }
}

async function downloadIfMissing(urlStr, destPath) {
  try {
    const stat = await fs.stat(destPath);
    if (stat.isFile() && stat.size > 0) {
      return "exists";
    }
  } catch {}
  await new Promise((resolve, reject) => {
    const client = urlStr.startsWith("https:") ? https : http;
    const req = client.get(urlStr, (res) => {
      if (
        res.statusCode &&
        res.statusCode >= 300 &&
        res.statusCode < 400 &&
        res.headers.location
      ) {
        const redirectUrl = res.headers.location;
        req.destroy();
        downloadIfMissing(redirectUrl, destPath)
          .then(() => resolve())
          .catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${urlStr}`));
        return;
      }
      fs.open(destPath, "w")
        .then((handle) => {
          const stream = handle.createWriteStream();
          res.pipe(stream);
          stream.on("finish", async () => {
            await handle.close();
            resolve();
          });
          stream.on("error", async (err) => {
            try {
              await handle.close();
            } catch {}
            reject(err);
          });
        })
        .catch(reject);
    });
    req.on("error", reject);
  });
  return "downloaded";
}

function convertContent(content, contentType) {
  const lines = content.split("\n");

  const nextNonEmptyIndex = (startIdx) => {
    for (let i = startIdx; i < lines.length; i++) {
      if (normalizeLine(lines[i]) !== "") return i;
    }
    return -1;
  };

  let idx = 0;

  // First line: projects attribution; events ignore
  const firstLine = normalizeLine(lines[idx] ?? "");
  idx += 1;

  if (contentType === "projects") {
    idx = nextNonEmptyIndex(idx);
    if (idx === -1)
      throw new Error(
        "Unexpected EOF after attribution while skipping second non-empty line."
      );
    idx += 1;
  }

  // Find H1
  const h1CandidateIdx = nextNonEmptyIndex(idx);
  if (h1CandidateIdx === -1) throw new Error("Missing H1 title line.");
  const h1Line = normalizeLine(lines[h1CandidateIdx]);
  if (!h1Line.startsWith("# ")) {
    if (contentType === "events") {
      let foundIdx = -1;
      for (
        let i = h1CandidateIdx + 1;
        i < Math.min(lines.length, h1CandidateIdx + 15);
        i++
      ) {
        const s = normalizeLine(lines[i]);
        if (s.startsWith("# ")) {
          foundIdx = i;
          break;
        }
      }
      if (foundIdx === -1)
        throw new Error(`Expected H1 starting with "# ", got: "${h1Line}"`);
      idx = foundIdx + 1;
    } else {
      throw new Error(`Expected H1 starting with "# ", got: "${h1Line}"`);
    }
  } else {
    idx = h1CandidateIdx + 1;
  }
  const title = h1Line.startsWith("# ")
    ? h1Line.slice(2).trim()
    : normalizeLine(lines[idx - 1])
        .slice(2)
        .trim();

  // Branch-specific ordering:
  // - Projects: images → date → location → content
  // - Events: date → images → content

  let rawImages = [];
  let dateRange = { from: "", to: "" };
  let date = "";
  let location = "";

  if (contentType === "projects") {
    // Collect images first
    while (true) {
      const nextIdx2 = nextNonEmptyIndex(idx);
      if (nextIdx2 === -1)
        throw new Error(
          "Unexpected EOF while reading images/date/location/content."
        );
      const candidate = normalizeLine(lines[nextIdx2]);
      const img = parseImageLink(candidate);
      if (img) {
        rawImages.push(img);
        idx = nextIdx2 + 1;
        continue;
      }
      idx = nextIdx2;
      break;
    }

    // Date
    const dateLineIdx = nextNonEmptyIndex(idx);
    if (dateLineIdx === -1) throw new Error("Missing date line.");
    const dateLineRaw = lines[dateLineIdx];
    const parsed = parseProjectsDateLine(dateLineRaw);
    date = parsed.date;
    dateRange = parsed.dateRange;
    idx = dateLineIdx + 1;

    // Location
    const locIdx = nextNonEmptyIndex(idx);
    if (locIdx === -1) throw new Error("Missing location line.");
    location = normalizeLine(lines[locIdx]);
    idx = locIdx + 1;
  } else {
    // Events: date first
    const dateLineIdx = nextNonEmptyIndex(idx);
    if (dateLineIdx === -1) throw new Error("Missing date line.");
    const dateLineRaw = lines[dateLineIdx];
    dateRange = parseEventsDateLine(dateLineRaw).dateRange;
    idx = dateLineIdx + 1;

    // Then images
    while (true) {
      const nextIdx2 = nextNonEmptyIndex(idx);
      if (nextIdx2 === -1) break;
      const candidate = normalizeLine(lines[nextIdx2]);
      const img = parseImageLink(candidate);
      if (img) {
        rawImages.push(img);
        idx = nextIdx2 + 1;
        continue;
      }
      idx = nextIdx2;
      break;
    }
  }

  // Content
  const contentStartIdx = nextNonEmptyIndex(idx);
  const contentBodyLines =
    contentStartIdx === -1 ? lines.slice(idx) : lines.slice(contentStartIdx);
  const body = contentBodyLines.join("\n");

  // Images post-processing:
  const images = rawImages.map(({ alt, href }) => ({
    alt,
    src: getFilenameFromUrl(href),
    href,
  }));

  const frontmatter =
    contentType === "projects"
      ? buildFrontmatterProjects({
          title,
          date,
          location,
          attribution: firstLine,
          images: images.map(({ alt, src }) => ({ alt, src })),
          dateRange,
        })
      : buildFrontmatterEvents({
          title,
          images: images.map(({ alt, src }) => ({ alt, src })),
          dateRange,
        });

  return {
    outputText: `${frontmatter}\n${body}`,
    images,
  };
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function fileTextOrEmpty(pathname) {
  try {
    return await fs.readFile(pathname, "utf8");
  } catch {
    return "";
  }
}

async function main() {
  const [sourceDirArg, outputDirArg, contentTypeArg, downloadDirArg] =
    process.argv.slice(2);

  if (!sourceDirArg || !outputDirArg || !contentTypeArg) {
    console.error(
      "Usage: node scripts/convert-markdown-to-frontmatter.mjs <sourceDir> <outputDir> <contentType> [downloadDir]"
    );
    console.error('contentType must be "projects" or "events"');
    process.exit(1);
  }
  const contentType =
    contentTypeArg === "events"
      ? "events"
      : contentTypeArg === "projects"
      ? "projects"
      : null;
  if (!contentType) {
    console.error('Invalid contentType. Use "projects" or "events".');
    process.exit(1);
  }

  const sourceDir = path.resolve(PROJECT_ROOT, sourceDirArg);
  const outputDir = path.resolve(PROJECT_ROOT, outputDirArg);
  const downloadDir = downloadDirArg
    ? path.resolve(PROJECT_ROOT, downloadDirArg)
    : null;

  await ensureDir(outputDir);
  if (downloadDir) await ensureDir(downloadDir);

  const entries = await fs.readdir(sourceDir, { withFileTypes: true });
  const mdFiles = entries
    .filter((de) => de.isFile() && de.name.toLowerCase().endsWith(".md"))
    .map((de) => de.name);

  if (mdFiles.length === 0) {
    console.error("No .md files found in source directory:", sourceDir);
    process.exit(2);
  }

  for (const name of mdFiles) {
    const inPath = path.join(sourceDir, name);
    const outPath = path.join(outputDir, name);

    const originalText = await fs.readFile(inPath, "utf8");

    try {
      const { outputText, images } = convertContent(originalText, contentType);
      const existingOut = await fileTextOrEmpty(outPath);

      if (existingOut !== outputText) {
        await fs.writeFile(outPath, outputText, "utf8");
        console.log(`Converted: ${name}`);
      } else {
        console.log(`Unchanged: ${name}`);
      }

      if (downloadDir) {
        for (const img of images) {
          const filename = img.src;
          const target = path.join(downloadDir, filename);
          try {
            const result = await downloadIfMissing(img.href, target);
            if (result === "downloaded") {
              console.log(`Downloaded image: ${filename}`);
            } else if (result === "exists") {
              console.log(`Image already present: ${filename}`);
            }
          } catch (err) {
            console.error(
              `Failed to download image "${filename}" from "${img.href}": ${err.message}`
            );
          }
        }
      }
    } catch (err) {
      console.error(`Failed to convert ${name}: ${err.message}`);
      process.exitCode = 3;
    }
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(99);
});
