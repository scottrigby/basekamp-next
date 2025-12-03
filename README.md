# Basekamp Next.js website

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## To-do

- [ ] Add Netlify redirects:
    - [ ] Run a web crawler to build a link list and check if we need other redirects
    <!-- old subdomains -->
    - [x] from `http://lists.basekamp.com/` to `https://basekamp.com`
    <!-- removed sections and individual pages -->
    - [x] from `http://basekamp.com/getin/*` to `/`
    - [x] from `http://basekamp.com/getin/discussions/irc` to `/contact`
    - [x] from `http://basekamp.com/user/*` to `/` (login and forgot password pages. all other user/ pages were not public)
    - [x] from `http://basekamp.com/info` to `/`
    - [x] from `http://basekamp.com/support` to `/contact`
    <!-- moved individual pages -->
    - [x] from `http://basekamp.com/about` to `/` (deliberate: about page is now home page)
    - [x] from `http://basekamp.com/info/contact` to `/contact`
    - [x] from `http://basekamp.com/info/calendar` to `/events`
    <!-- moved sections -->
    - [x] from `http://basekamp.com/about/projects` to `/projects`
    - [x] from `http://basekamp.com/about/projects/list` to `/projects`
    - [x] from `http://basekamp.com/about/projects/calendar` to `/projects`
    - [x] from `http://basekamp.com/about/projects/*` to `/projects/:splat`
    - [x] from `http://basekamp.com/about/events` to `/events`
    - [x] from `http://basekamp.com/about/events/list` to `/events`
    - [x] from `http://basekamp.com/about/events/calendar` to `/events`
    - [x] from `http://basekamp.com/about/events/*` to `/events/:splat`
    <!-- already broken -->
    - [x] from `http://basekamp.com/info/lists` to `/`
    - [x] from `http://basekamp.com/mailman/*` to `/contact`
- [x] Add new pages:
    - [x] "Thanks" page, from http://basekamp.com/support/allies. Link in footer behind copyright
    - [x] from `http://basekamp.com/skype` to `/`
    - [x] from `http://basekamp.com/irc` to `/contact`
- [ ] Look on server for other files (sites/default/files) and make sure we have them stored somewhere in case they're needed. Evaluate whether we add to git, host somewhere else, or just keep as backup somewhere without serving them online for the time being
- [ ] Fix project/event grid style on mobile (should be 2 wide in portrait)
- [ ] Style project/event detail page images to be carousel across the top in small widths, rather than below the text
- [x] Change slideshow to an existing library. Mine works but a11y is low (eg, tabbing moves through page behind model not over the modal or image for alt text etc)

## Getting Started

First, instal the dependencies:

```bash
npm install
```

Then you can run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

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
