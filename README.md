# Lens & Light — Photography Portfolio

A static photography portfolio site with a home page and a full gallery. Images are loaded from an API (no hardcoded image URLs). Responsive layout, lazy loading, category filters, and a lightbox for viewing images.

## Project structure

```
photography-portfolio/
├── index.html          # Home page (hero, featured gallery, about, contact)
├── gallery.html        # Full gallery page with filters and lightbox
├── styles.css          # Global styles
├── gallery.css         # Gallery page styles
├── script.js           # Home page logic + image loading from API
├── gallery.js          # Gallery page: fetch images, grid, filters, lightbox
├── gallery-config.js   # API URL and config (edit this to point to your API)
└── README.md
```
