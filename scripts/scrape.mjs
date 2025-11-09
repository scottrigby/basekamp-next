// scripts/scrape.mjs
// Usage:
//   node scripts/scrape.mjs --type events --out source-content/events [--verbose] [--dry-run] [--concurrency 4]
//   node scripts/scrape.mjs --type projects --out source-content/projects [--verbose] [--dry-run] [--concurrency 4]
//
// Scrapes Basekamp grid pages and converts each item to Markdown via markdownify console script in a managed venv.
// Adds concurrent conversion, strips fixed navigation/footer blocks from the output,
// and for projects prepends per-item attribution (from the grid) at the very top with a blank line afterward.

import { mkdir, access, readFile, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { dirname, resolve as resolvePath } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { request } from "undici";
import { load } from "cheerio";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = "http://basekamp.com";

// Exact blocks to remove (including the leading/trailing blank lines)
const BLOCK_TOP = `

[Skip to Navigation](#navigation "#navigation")

* [About](/about "About")
* [Get involved](/getin "Get involved")
* [Stay informed](/info "Mailing lists")
* [Support](/support "Support")

[![Home](/sites/all/themes/kampfour/basekamp-f90.png)](/ "Home")

* [Log in](/user/login "/user/login")

`;
const BLOCK_BOTTOM_CALENDAR = `
* [Calendar](/calendar "View the calendar.")
`;
const BLOCK_BOTTOM = `
* [About Basekamp](/about "About Basekamp")
* [Events](/about/events "/about/events")
* [Projects](/about/projects "/about/projects")

* [About](/about "About")
  + [About Basekamp](/about "About Basekamp")
  + [Events](/about/events "/about/events")
  + [Projects](/about/projects "/about/projects")
* [Get involved](/getin "Get involved")
  + [Discussions](/getin "Discussions")
  + [Visit us](/getin/visit "Stay with us")
  + [Work with us](/getin/work "Work with us")
* [Stay informed](/info "Mailing lists")
  + [Mailing lists](/info "/info")
  + [Events calendar](/info/calendar "/info/calendar")
  + [Contact](/info/contact "/info/contact")
* [Support](/support "Support")
  + [How and why](/support "How and why")
  + [Allies](/support/allies "Allies")
  + [Donate link (new!) »](https://www.wepay.com/donate/basekamp "https://www.wepay.com/donate/basekamp")

[![Creative Commons License](/sites/all/themes/kampfour/by-nc-sa.png "Creative Commons Attribution-Noncommercial-Share Alike 3.0 Unported License")](http://creativecommons.org/licenses/by-nc-sa/3.0/ "http://creativecommons.org/licenses/by-nc-sa/3.0/")  
This site is licensed under a [Creative Commons Attribution-Noncommercial-Share Alike 3.0 Unported License](http://creativecommons.org/licenses/by-nc-sa/3.0/ "http://creativecommons.org/licenses/by-nc-sa/3.0/").

`;

function escapeForRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Build safe regexes that match the exact blocks, including the blank lines around them
const blockTopRe = new RegExp(escapeForRegex(BLOCK_TOP), "g");
const blockBottomCalendarRe = new RegExp(escapeForRegex(BLOCK_BOTTOM_CALENDAR), "g");
const blockBottomRe = new RegExp(escapeForRegex(BLOCK_BOTTOM), "g");

function parseArgs(argv) {
  const args = new Map();
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const [key, valRaw] = a.includes("=")
        ? a.split("=")
        : [a, argv[i + 1]?.startsWith("--") ? undefined : argv[++i]];
      const val = valRaw ?? true;
      args.set(key.replace(/^--/, ""), val);
    }
  }
  return {
    type: args.get("type"),
    out: args.get("out"),
    verbose: Boolean(args.get("verbose")),
    dryRun: Boolean(args.get("dry-run")),
    concurrency: Number(args.get("concurrency") ?? 4),
  };
}

function usageAndExit(msg) {
  if (msg) console.error(msg);
  console.error(
    "Usage: node scripts/scrape.mjs --type events|projects --out <output_dir> [--verbose] [--dry-run] [--concurrency N]"
  );
  process.exit(1);
}

async function ensureDir(p) {
  await mkdir(p, { recursive: true });
}

function normalizeUrl(href, base = BASE_URL) {
  try {
    const u = new URL(href, base);
    if (u.hostname.endsWith("basekamp.com")) {
      u.protocol = "http:"; // force http (site has no SSL)
      u.hash = "";
      u.search = "";
      return u.toString();
    }
    return null;
  } catch {
    return null;
  }
}

function includePath(url, type) {
  if (!url) return false;
  const u = new URL(url);
  const path = u.pathname;
  if (!path.startsWith(`/about/${type}/`)) return false;
  if (/^\/about\/(events|projects)\/(list|calendar|feed)(\/|$)/.test(path))
    return false;
  return true;
}

// Manual redirect follower for robustness
async function fetchHtmlFollowRedirects(url, maxHops = 10) {
  let current = url;
  for (let i = 0; i < maxHops; i++) {
    const { statusCode, headers, body } = await request(current, {
      headers: {
        "user-agent": "BasekampScraper/1.0 (+node esm)",
        accept: "text/html,application/xhtml+xml",
      },
    });

    if (statusCode >= 300 && statusCode < 400) {
      const loc = headers.location || headers.Location;
      if (!loc)
        throw new Error(
          `Redirect without Location from ${current} (HTTP ${statusCode})`
        );
      current = new URL(loc, current).toString();
      continue;
    }

    if (statusCode < 200 || statusCode >= 300) {
      throw new Error(`HTTP ${statusCode} for ${current}`);
    }

    const html = await body.text();
    return html;
  }
  throw new Error(`Too many redirects (> ${maxHops}) starting at ${url}`);
}

function extractLinks(html, type) {
  const $ = load(html);
  const hrefs = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (href) hrefs.push(href);
  });
  const normalized = [];
  const seen = new Set();
  for (const h of hrefs) {
    const abs = normalizeUrl(h);
    if (!abs) continue;
    if (!includePath(abs, type)) continue;
    if (!seen.has(abs)) {
      seen.add(abs);
      normalized.push(abs);
    }
  }
  return normalized;
}

// Projects-only: collect attribution text from each grid item
function extractProjectAttributionsFromGrid(html) {
  // Map<absoluteItemUrl, attributionText>
  const $ = load(html);
  const map = new Map();
  $("li.views-fluid-grid-item, li.views-row").each((_, li) => {
    const $li = $(li);
    // link for this item
    const link = $li.find(".views-field-title .field-content a[href]").attr("href");
    if (!link) return;
    const abs = normalizeUrl(link);
    // attribution in this grid item
    const attr = $li
      .find(".views-field-field-project-attribution-value .field-content")
      .text()
      .trim();
    if (abs && attr) {
      map.set(abs, attr);
    }
  });
  return map;
}

async function ensureVenvMarkdownifyBin(venvDir) {
  const venvPython = resolvePath(venvDir, "bin", "python");
  const markdownifyBin = resolvePath(venvDir, "bin", "markdownify");

  // Ensure venv exists
  try {
    await access(venvPython);
  } catch {
    await new Promise((resolve, reject) => {
      const p = spawn("python3", ["-m", "venv", venvDir], { stdio: "inherit" });
      p.on("exit", (code) =>
        code === 0
          ? resolve()
          : reject(new Error(`venv creation failed (${code})`))
      );
    });
  }

  // Upgrade pip tooling
  await new Promise((resolve, reject) => {
    const p = spawn(
      venvPython,
      ["-m", "pip", "install", "--upgrade", "pip", "setuptools", "wheel"],
      { stdio: "inherit" }
    );
    p.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`pip upgrade failed (${code})`))
    );
  });

  // Ensure markdownify installed
  let needInstall = false;
  await new Promise((resolve) => {
    const p = spawn(venvPython, ["-m", "pip", "show", "markdownify"]);
    p.on("exit", (code) => {
      needInstall = code !== 0;
      resolve();
    });
  });
  if (needInstall) {
    await new Promise((resolve, reject) => {
      const p = spawn(venvPython, ["-m", "pip", "install", "markdownify"], {
        stdio: "inherit",
      });
      p.on("exit", (code) =>
        code === 0
          ? resolve()
          : reject(new Error(`pip install markdownify failed (${code})`))
      );
    });
  }

  // Verify console script exists
  try {
    await access(markdownifyBin);
  } catch {
    throw new Error(
      `markdownify console script not found at ${markdownifyBin} (pip may not have created an entry point)`
    );
  }

  return { markdownifyBin };
}

async function convertPageToMarkdown(
  url,
  outfile,
  markdownifyBin,
  attributionTop
) {
  const html = await fetchHtmlFollowRedirects(url);
  await ensureDir(dirname(outfile));

  // Convert HTML -> Markdown
  await new Promise((resolve, reject) => {
    const child = spawn(
      markdownifyBin,
      [
        "--heading-style",
        "atx",
        "--strip",
        "script",
        "--strip",
        "style",
        "--autolinks",
      ],
      { stdio: ["pipe", "pipe", "inherit"] }
    );
    child.stdin.write(html);
    child.stdin.end();

    const ws = createWriteStream(outfile, { encoding: "utf-8" });
    child.stdout.pipe(ws);

    child.on("error", reject);
    child.on("exit", (code) => {
      ws.end();
      if (code === 0) resolve();
      else reject(new Error(`markdownify exited with code ${code}`));
    });
  });

  // Ensure trailing newline
  await new Promise((resolve, reject) => {
    const sh = `[[ -s "${outfile}" && "$(tail -c 1 "${outfile}" || true)" != $'\\n' ]] && echo >> "${outfile}" || true`;
    const p = spawn("bash", ["-lc", sh], { stdio: "inherit" });
    p.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`newline append failed (${code})`))
    );
  });

  // Strip fixed navigation/footer blocks and prepend attribution if provided (projects only)
  try {
    let md = await readFile(outfile, "utf-8");
    md = md
      .replace(blockTopRe, "")
      .replace(blockBottomCalendarRe, "")
      .replace(blockBottomRe, "");

    if (attributionTop && attributionTop.trim().length > 0) {
      md = `${attributionTop.trim()}\n\n${md}`;
    }

    await writeFile(outfile, md, "utf-8");
  } catch (err) {
    // Non-fatal; log and continue
    console.error(`Post-process failed for ${outfile}: ${err.message}`);
  }
}

async function runConcurrent(tasks, concurrency) {
  const queue = tasks.slice();
  let active = 0;
  let done = 0;
  return new Promise((resolve) => {
    const next = () => {
      while (active < concurrency && queue.length) {
        const fn = queue.shift();
        active++;
        fn()
          .catch((err) => {
            console.error(err.message || err);
          })
          .finally(() => {
            active--;
            done++;
            if (done === tasks.length) {
              resolve();
            } else {
              next();
            }
          });
      }
    };
    next();
  });
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.type || !["events", "projects"].includes(args.type)) {
    usageAndExit('Error: --type must be "events" or "projects".');
  }
  if (!args.out) usageAndExit("Error: --out is required.");
  const concurrency =
    Number.isFinite(args.concurrency) && args.concurrency > 0
      ? args.concurrency
      : 4;

  const sourceUrl = `${BASE_URL}/about/${args.type}/grid`;

  if (args.verbose) {
    console.log(`Source URL: ${sourceUrl}`);
    console.log(`Type: ${args.type}`);
    console.log(`Output dir: ${args.out}`);
    console.log(`Concurrency: ${concurrency}`);
    if (args.dryRun) console.log("Dry run: enabled");
  }

  // Fetch grid HTML
  let gridHtml;
  try {
    gridHtml = await fetchHtmlFollowRedirects(sourceUrl);
  } catch (err) {
    console.error(`Failed to fetch source URL: ${err.message}`);
    process.exit(1);
  }

  // Extract links
  const links = extractLinks(gridHtml, args.type);
  if (args.verbose) {
    console.log(`Discovered ${links.length} ${args.type} URL(s):`);
    for (const u of links) console.log(`  - ${u}`);
  }
  if (links.length === 0) {
    console.log(
      `No URLs found matching /about/${args.type}/ (excluding list/calendar/feed).`
    );
    process.exit(0);
  }

  // Projects: build attribution map from the grid
  const attributionMap =
    args.type === "projects"
      ? extractProjectAttributionsFromGrid(gridHtml)
      : new Map();

  // Ensure venv markdownify console script
  const venvDir = resolvePath(__dirname, "..", ".venv");
  let markdownifyBin;
  try {
    ({ markdownifyBin } = await ensureVenvMarkdownifyBin(venvDir));
  } catch (err) {
    console.error(
      `Failed to prepare markdownify console script: ${err.message}`
    );
    process.exit(1);
  }

  let converted = 0;
  let errors = 0;

  const tasks = links.map((url) => async () => {
    const u = new URL(url);
    const slug = u.pathname
      .replace(new RegExp(`^/about/${args.type}/`), "")
      .replace(/\/$/, "");
    if (!slug) {
      if (args.verbose) console.log(`Skip (empty slug): ${url}`);
      return;
    }
    const outfile = resolvePath(args.out, `${slug}.md`);
    if (args.verbose) console.log(`Processing: ${url} -> ${outfile}`);

    if (args.dryRun) return;

    const attributionTop =
      args.type === "projects" ? attributionMap.get(url) ?? "" : "";

    try {
      await convertPageToMarkdown(url, outfile, markdownifyBin, attributionTop);
      converted++;
      await sleep(25);
    } catch (err) {
      console.error(`Error converting ${url}: ${err.message}`);
      errors++;
    }
  });

  await runConcurrent(tasks, concurrency);

  console.log(`Done. Converted ${converted} file(s) to ${args.out}.`);
  if (errors > 0) console.log(`Completed with ${errors} error(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
