# Birthday App

Tiny RSVP site for a short-lived birthday invite, built for free hosting on Cloudflare Pages with a D1 database.

## Why this setup

- Cloudflare Pages is reliable and easy to host publicly.
- D1 gives you a lightweight SQLite-style database without managing a server.
- The app is plain HTML, CSS, and JavaScript, so there is very little to break.

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a D1 database:

   ```bash
   npx wrangler d1 create birthday-rsvp
   ```

3. Copy the returned `database_id` into `wrangler.jsonc`.

4. Apply the schema:

   ```bash
   npx wrangler d1 execute birthday-rsvp --file=schema.sql
   ```

5. For local development, set a strong admin password in `wrangler.jsonc`.

6. Run locally:

   ```bash
   npm run dev
   ```

## Deploy

1. Log in to Cloudflare:

   ```bash
   npx wrangler login
   ```

2. Deploy the site:

   ```bash
   npm run deploy
   ```

3. Set the production admin password as a secret:

   ```bash
   npx wrangler pages secret put ADMIN_PASSWORD
   ```

4. In the Cloudflare dashboard, confirm the project is connected to the D1 database for production.

## Pages

- `/` is the invite page.
- `/admin.html` is the password-protected RSVP dashboard.
- `/api/rsvp` accepts RSVP submissions.
- `/api/admin` returns RSVP records when the password matches.
