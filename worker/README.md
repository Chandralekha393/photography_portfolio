# Gallery API Worker

This Cloudflare Worker lists image keys from your R2 bucket and returns JSON for the portfolio gallery.

## 1. Configure the bucket

Edit `wrangler.toml` and set your R2 bucket name:

```toml
[[r2_buckets]]
binding = "IMAGES"
bucket_name = "your-actual-bucket-name"
```

Use the same bucket that backs **https://chandralekha.me/images/** (or the bucket where your images are stored).

## 2. Deploy the Worker

```bash
cd worker
npm init -y
npx wrangler deploy
```

After deploy, you’ll get a URL like `https://gallery-api.<your-subdomain>.workers.dev`.

## 3. Optional — Custom domain

In Cloudflare Dashboard → Workers & Pages → your worker → Settings → Domains, add a custom route, e.g.:

- `https://chandralekha.me/api/gallery`  
  or  
- `https://api.chandralekha.me/gallery`

## 4. Point the gallery at the Worker

In **gallery-config.js** (in the project root), set:

```js
WORKER_GALLERY_URL: 'https://gallery-api.<your-subdomain>.workers.dev',
```

or your custom URL, e.g. `https://chandralekha.me/api/gallery`.

## API response shape

`GET` on the Worker URL returns:

```json
{
  "images": [
    { "path": "landscapes/sunset.jpg", "title": "Sunset", "category": "landscapes", "orientation": "landscape" }
  ]
}
```

- **path** — Object key in R2 (used with your base URL to build image `src`).
- **title** — From filename; override via R2 custom metadata if you add it later.
- **category** — From first path segment (`landscapes/`, `wildlife/`, `nightscapes/`) or default `landscapes`.
- **orientation** — Default `landscape`; set to `portrait` in R2 custom metadata if you add support.

Images are filtered by extension: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`.
