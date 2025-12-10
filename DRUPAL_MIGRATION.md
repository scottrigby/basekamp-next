# Drupal Migration

Documentation for migrating content from the legacy Drupal site to Next.js.

**Note:** The old Drupal site has moved to http://old.basekamp.com

## Content Migration Scripts

For both events and projects, run these same scripts.

### 1. Scrape content from Drupal

Run web scraper with flags `--type <contentType>`, `--out <outputDir>`, and optionally `[--verbose] [--dry-run] [--concurrency <NUM>]`:

```console
node scripts/scrape.mjs --type events --out source-content/events --concurrency 6 --verbose
node scripts/scrape.mjs --type projects --out source-content/projects --concurrency 6 --verbose
```

### 2. Convert to Next.js frontmatter format

Run migration script with args `<sourceDir>`, `<outputDir>`, `<contentType>`, and optionally `[downloadDir]`:

```console
node scripts/convert-markdown-to-frontmatter.mjs source-content/events content/events/ events public
node scripts/convert-markdown-to-frontmatter.mjs source-content/projects content/projects/ projects public
```

## Sitemap Verification

Check the old Drupal XML sitemap against the new Netlify deployment:

```console
node scripts/check-xml-sitemap.mjs
```

This script:

- Fetches `http://old.basekamp.com/sitemap.xml`
- Enriches `/node/N` paths with title and node-type from the Drupal site
- Checks aliased paths against `https://basekamp.netlify.app` for redirect status

**Outputs:**

- `nodes.csv` - `/node/N,Title,node-type-*`
- `aliased.csv` - `/path,status,[location],[finalStatus]`
- `missing.csv` - Rows with missing title or node-type (if any)

## Redirect Configuration

Legacy URL redirects are configured in `netlify.toml`.

### Redirect types

| Pattern             | Destination        | Notes                  |
| ------------------- | ------------------ | ---------------------- |
| `/about`            | `/`                | Home page              |
| `/about/projects/*` | `/projects/:splat` | Project detail pages   |
| `/about/events/*`   | `/events/:splat`   | Event detail pages     |
| `/info/contact`     | `/contact`         | Contact page           |
| `/support/allies`   | `/allies`          | Allies page            |
| `/node/*`           | `/`                | Unaliased Drupal nodes |
| `/user/*`           | `/`                | User pages (removed)   |

### Adding new redirects

Add to `netlify.toml`:

```toml
[[redirects]]
from = "/old-path"
to = "/new-path"
status = 302
```

Use `301` for permanent redirects, `302` for temporary.

## Manual Verification

After migration, manually verify:

1. **Content accuracy** - Spot-check several projects and events
2. **Image paths** - Ensure images load correctly
3. **Redirect coverage** - Test old URLs redirect properly
4. **404 handling** - Verify unmatched paths show 404 page
