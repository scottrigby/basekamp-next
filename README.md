# Basekamp Next.js website

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## To-do

- [ ] Add Netlify redirects:
    - [ ] Run a web crawler to build a link list and check if we need other redirects
    <!-- old subdomains -->
    - [ ] from `http://lists.basekamp.com/` to `https://basekamp.com`
    <!-- removed sections and individual pages -->
    - [ ] from `http://basekamp.com/getin/*` to `/`
    - [ ] from `http://basekamp.com/skype` to `/`
    - [ ] from `http://basekamp.com/user/*` to `/` (login and forgot password pages. all other user/ pages were not public)
    - [ ] from `http://basekamp.com/info/lists` to `/`
    <!-- moved individual pages -->
    - [ ] from `http://basekamp.com/about` to `/` (deliberate: about page is now home page)
    - [ ] from `http://basekamp.com/info/contact` to `/contact`
    - [ ] from `http://basekamp.com/info/calendar` to `/events`
    <!-- moved sections -->
    - [ ] from `http://basekamp.com/about/projects` to `/projects`
    - [ ] from `http://basekamp.com/about/projects/list` to `/projects`
    - [ ] from `http://basekamp.com/about/projects/calendar` to `/projects`
    - [ ] from `http://basekamp.com/about/projects/*` to `/projects/:splat`
    - [ ] from `http://basekamp.com/about/events` to `/events`
    - [ ] from `http://basekamp.com/about/events/list` to `/events`
    - [ ] from `http://basekamp.com/about/events/calendar` to `/events`
    - [ ] from `http://basekamp.com/about/events/*` to `/events/:splat`
- [ ] Add new pages:
    - [ ] "Support" page, from http://basekamp.com/support. Link in footer behind copyright
    - [ ] "Thanks" page, from http://basekamp.com/support/allies. Link in footer behind copyright
- [ ] Look on server for other files (sites/default/files) and make sure we have them stored somewhere in case they're needed. Evaluate whether we add to git, host somewhere else, or just keep as backup somewhere without serving them online for the time being

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

### Projects

1. Use [Webpage to Markdown](https://chromewebstore.google.com/detail/fgpepdeaaldghnmehdmckfibbhcjoljj) browser extension to convert project page content to markdown, and save into `source-content/projects/PATH_NAME.md`
2. Add attribition line at the top of each file (copy manually from projects list page)
3. Run project migration script with args \<sourceDir\>, \<outputDir\>, \<contentType\> (where contentType = {"projects", "events"}), and optionally \[downloadDir\] (for images):

    ```console
    % node scripts/convert-markdown-to-frontmatter.mjs source-content/projects content/projects/ projects public
    ```

### Events

1. Use script to convert web pages to markdown:

    ```console
    % ./scripts/scrape-events.sh source-content/events
    Fetching homepage: http://basekamp.com/
    Found 114 event URLs.
    Done. Converted 114 file(s). Output dir: source-content/events
    ```
2. Run project migration script with args \<sourceDir\>, \<outputDir\>, \<contentType\> (where contentType = {"projects", "events"}), and optionally \[downloadDir\] (for images):

    ```console
    % node scripts/convert-markdown-to-frontmatter.mjs source-content/events content/events/ events public
    ```
