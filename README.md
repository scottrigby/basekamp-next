# Basekamp Next.js website

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then you can run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Contact Form

This project uses [Resend](https://resend.com) for sending notification email from the contact form.

Set these variables and restart your app.

1. Environment variables

    Add to your `.env` (local) or hosting provider’s env settings:

    ```bash
    RESEND_API_KEY=your_resend_api_key
    CONTACT_FROM="Webform <webform@mail.yourdomain.com>"
    CONTACT_TO=you@yourdomain.com
    ```

2. Verify your sending domain

    In Resend, add and verify a domain for better deliverability (domain for above example would be `mail.yourdomain.com`).

3. Restart

    After setting env vars, restart `npm run dev`.

## Content Migration

For both events and projects, run these same scripts.

1. Run web scraper to markdown script with flags `--type <contentType>`, `--out <outputDir>`, and optionally `[--verbose] [--dry-run] [--concurrency <NUM>]`:

    - `<contentType>` is `projects` or `events`
    - `<outputDir>` is where temporary source markdown files will be written, which are used for processing the final .md files for Next.js.

    ```console
    % node scripts/scrape.mjs --type events --out source-content/events --concurrency 6 --verbose
    % node scripts/scrape.mjs --type projects --out source-content/projects --concurrency 6 --verbose
    ```
2. Run project migration script with args `<sourceDir>`, `<outputDir>`, `<contentType>`, and optionally `[downloadDir]`:

    - `<contentType>` same as `scrape.mjs`
    - `<sourceDir>` is where the scraped markdown files live that are used to process the final Next.js .md files. This should be the same path as `<outputDir>` you passed to `scrape.mjs`.
    - `<outputDir>` is where the processed Next.js files will be written (should be `content/<contentType>`)
    - `[downloadDir]` is where you want to download the images from paths in the scraped source markdown files (should be `public` for now, but for example we could move events and project images to separate dirs below public if we wish by setting this to `public/<contentType>`)

    ```console
    % node scripts/convert-markdown-to-frontmatter.mjs source-content/events content/events/ events public
    % node scripts/convert-markdown-to-frontmatter.mjs source-content/projects content/projects/ projects public
    ```
