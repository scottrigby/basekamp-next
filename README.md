# Basekamp Next.js website

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

1. Use [LINK_TO_TOOL] browser extension to convert project page content to markdown, and save into `source-content/projects/PATH_NAME.md`
2. Run project migration script with args \<sourceDir\>, \<outputDir\>, and optionally \[downloadDir\] (for images):

    ```console
    % node scripts/convert-markdown-to-frontmatter.mjs source-content/projects content/projects/ public
    ```
