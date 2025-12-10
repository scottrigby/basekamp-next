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

## Adding Content

Content is stored as markdown files with YAML frontmatter.

Images should be placed in `public/` and referenced without the leading slash in frontmatter.

### Pages

Add markdown files to `content/pages/`. The filename becomes the URL path.

```yaml
# content/pages/about.md → /about
---
title: About Us
description: Optional meta description
images: # optional
  - src: image.jpg
    alt: Description
---
Your markdown content here.
```

### Projects

Add markdown files to `content/projects/`.

```yaml
# content/projects/my-project.md → /projects/my-project
---
title: Project Title
date: 2024-01-15
location: Philadelphia
attribution: Artist Name
images:
  - src: project-image.jpg
    alt: Description
---
Project description in markdown.
```

### Events

Add markdown files to `content/events/`.

```yaml
# content/events/my-event.md → /events/my-event
---
title: Event Title
dateRange:
  from: 2024-01-15
  to: 2024-01-20
images:
  - src: event-image.jpg
    alt: Description
---
Event description in markdown.
```

## Contact Form

This project uses [Resend](https://resend.com) for sending notification email from the contact form.

Set these variables and restart your app.

1. Environment variables

   Add to your `.env` (local) or hosting provider's env settings:

   ```bash
   RESEND_API_KEY=your_resend_api_key
   CONTACT_FROM="Webform <webform@mail.yourdomain.com>"
   CONTACT_TO=you@yourdomain.com
   ```

2. Verify your sending domain

   In Resend, add and verify a domain for better deliverability (domain for above example would be `mail.yourdomain.com`).

3. Restart

   After setting env vars, restart `npm run dev`.
