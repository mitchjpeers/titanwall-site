# Titanwall Site

Marketing site for Titanwall MGO structural insulated panels. Served via GitHub Pages from `main`:
https://mitchjpeers.github.io/titanwall-site/

## Launch setup (one-time)

### 1. Quote form → inbox (Web3Forms)

1. Go to https://web3forms.com and create an access key **using the inbox that should receive quote requests** (e.g. marc@titanwall.com). The key is emailed to that address.
2. In `index.html`, find `name="access_key" value=""` inside the quote form and paste the key between the quotes.
3. Commit and push. Send one test inquiry from the live site and confirm it arrives (check spam the first time and mark it "not spam").

Until a key is set, the form falls back to opening the visitor's email app, so it never silently drops a message.

Replies: each email's Reply-To is the visitor's address, so hitting Reply answers the customer directly.

### 2. Analytics (Umami Cloud — cookieless, no consent banner)

1. Create a free account at https://cloud.umami.is and add a website for the live domain.
2. Copy the **Website ID** and paste it into `umamiWebsiteId: ''` near the top of `js/site.js`.
3. Commit and push. Visits appear in the Umami dashboard within a minute.

Tracked automatically: page views, referrers, devices, countries. Custom events: `Quote form started`, `Quote form invalid`, `Quote submitted`, `Quote failed`, `Quote button click`, `Phone click`, `Email click`, `Instagram click`.

### 3. Google Search Console

1. Add a URL-prefix property for the live URL at https://search.google.com/search-console and verify it (the HTML-tag method: paste the `<meta name="google-site-verification">` tag into the `<head>` of `index.html`).
2. Submit `sitemap.xml`.

## Moving to a custom domain

```bash
node tools/seo.js --site-url https://www.titanwall.com/
```

This rewrites every absolute URL (canonical links, share tags, sitemap, robots, the form's no-JavaScript redirect, the analytics domain) and writes the `CNAME` file. Then set the custom domain in the repo's GitHub Pages settings and point the domain's DNS at GitHub Pages. Note that `robots.txt` is only read at a domain root, so it takes effect once the site is on its own domain.

## Editing

- Shared styles: `css/site.css`. Shared behaviour: `js/site.js`.
- Project pages are generated. Edit the `PROJECTS` array in `build-projects.js`, then run `node build-projects.js`. Don't hand-edit `projects/*.html`.
- After adding or renaming pages, run `node tools/seo.js` to refresh head tags, `sitemap.xml` and `robots.txt`.
