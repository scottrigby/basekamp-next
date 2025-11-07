// Usage (run from anywhere):
//   node scripts/convert-markdown-to-frontmatter.mjs <sourceDir> <outputDir> [downloadDir]
//
// Behavior:
// - Args are interpreted relative to the project root (parent of scripts/).
// - Converts template-formatted markdown headers into YAML frontmatter.
// - Optionally downloads images to downloadDir and sets images[].src to only the filename.
// - Idempotent: skips downloading images that already exist (non-empty file); only overwrites output files if conversion result changes.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import https from "node:https";
import http from "node:http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Project root is one directory up from scripts/
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

function formatISO({ year, month, day }) {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

function parseDateLine(line) {
  const normalized = normalizeLine(line);
  if (normalized.includes(" - ")) {
    const [fromRaw, toRaw] = normalized.split(" - ").map((s) => s.trim());
    const from = parseSingleDate(fromRaw);
    const to = parseSingleDate(toRaw);
    const date = from ? formatISO(from) : "";
    const dateRange = {
      from: from ? formatISO(from) : "",
      to: to ? formatISO(to) : "",
    };
    return { date, dateRange };
  } else {
    const d = parseSingleDate(normalized);
    const date = d ? formatISO(d) : "";
    return { date, dateRange: { from: date, to: "" } };
  }
}

function parseImageLink(line) {
  // Pattern: [![ALT](innerImageUrl)](outerLinkUrl)
  const normalized = normalizeLine(line);
  const m = normalized.match(/^\[!\[([^\]]*)\]\(([^)]+)\)\]\(([^)]+)\)$/);
  if (!m) return null;
  const alt = m[1].trim();
  const outerHref = m[3].trim();
  return { alt, href: outerHref };
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

function buildFrontmatter({
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

function getFilenameFromUrl(urlStr) {
  try {
    const u = new URL(urlStr);
    const base = path.basename(decodeURIComponent(u.pathname));
    return base || "image";
  } catch {
    return path.basename(urlStr);
  }
}

/**
 * Download a URL to a destination file path only if it doesn't already exist and is non-empty.
 * Returns:
 * - "downloaded" if a new file was saved
 * - "exists" if the file already exists and is non-empty
 * - throws on errors
 */
async function downloadIfMissing(urlStr, destPath) {
  // Check existence idempotently
  try {
    const stat = await fs.stat(destPath);
    if (stat.isFile() && stat.size > 0) {
      return "exists";
    }
    // If zero-length file exists (previous failed attempt), continue to re-download
  } catch {
    // not exists; proceed
  }

  await new Promise((resolve, reject) => {
    const client = urlStr.startsWith("https:") ? https : http;
    const req = client.get(urlStr, (res) => {
      // Follow one redirect
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

function convertContent(content) {
  const lines = content.split("\n");

  const nextNonEmptyIndex = (startIdx) => {
    for (let i = startIdx; i < lines.length; i++) {
      if (normalizeLine(lines[i]) !== "") return i;
    }
    return -1;
  };

  let idx = 0;

  // 1. attribution
  const attribution = normalizeLine(lines[idx] ?? "");
  idx += 1;

  // 2. skip next non-empty
  idx = nextNonEmptyIndex(idx);
  if (idx === -1)
    throw new Error(
      "Unexpected EOF after attribution while skipping second non-empty line."
    );
  idx += 1;

  // 3. title (H1)
  idx = nextNonEmptyIndex(idx);
  if (idx === -1) throw new Error("Missing H1 title line.");
  const h1Line = normalizeLine(lines[idx]);
  if (!h1Line.startsWith("# ")) {
    throw new Error(`Expected H1 starting with "# ", got: "${h1Line}"`);
  }
  const title = h1Line.slice(2).trim();
  idx += 1;

  // 4. images (zero or more)
  const rawImages = [];
  while (true) {
    const nextIdx = nextNonEmptyIndex(idx);
    if (nextIdx === -1)
      throw new Error(
        "Unexpected EOF while reading images/date/location/content."
      );
    const candidate = normalizeLine(lines[nextIdx]);
    const img = parseImageLink(candidate);
    if (img) {
      rawImages.push(img); // { alt, href }
      idx = nextIdx + 1;
      continue;
    }
    idx = nextIdx;
    break;
  }

  // 5. date
  const dateLineIdx = nextNonEmptyIndex(idx);
  if (dateLineIdx === -1) throw new Error("Missing date line.");
  const { date, dateRange } = parseDateLine(lines[dateLineIdx]);
  idx = dateLineIdx + 1;

  // 6. location
  const locIdx = nextNonEmptyIndex(idx);
  if (locIdx === -1) throw new Error("Missing location line.");
  const location = normalizeLine(lines[locIdx]);
  idx = locIdx + 1;

  // 7. content (preserved exactly)
  const contentStartIdx = nextNonEmptyIndex(idx);
  const contentBodyLines =
    contentStartIdx === -1 ? lines.slice(idx) : lines.slice(contentStartIdx);
  const body = contentBodyLines.join("\n");

  // Images post-processing:
  const images = rawImages.map(({ alt, href }) => ({
    alt,
    src: getFilenameFromUrl(href), // only filename
    href, // full href retained for optional download
  }));

  const frontmatter = buildFrontmatter({
    title,
    date,
    location,
    attribution,
    images: images.map(({ alt, src }) => ({ alt, src })), // only filename in frontmatter
    dateRange,
  });

  return {
    outputText: `${frontmatter}\n${body}`,
    images, // includes href + filename for download
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
  const [sourceDirArg, outputDirArg, downloadDirArg] = process.argv.slice(2);

  if (!sourceDirArg || !outputDirArg) {
    console.error(
      "Usage: node scripts/convert-markdown-to-frontmatter.mjs <sourceDir> <outputDir> [downloadDir]"
    );
    process.exit(1);
  }

  // Resolve args relative to project root
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
      const { outputText, images } = convertContent(originalText);
      const existingOut = await fileTextOrEmpty(outPath);

      // Idempotent write: only write if content differs
      if (existingOut !== outputText) {
        await fs.writeFile(outPath, outputText, "utf8");
        console.log(`Converted: ${name}`);
      } else {
        console.log(`Unchanged: ${name}`);
      }

      // Optional downloads (only if file missing)
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
            // Continue processing other images
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
