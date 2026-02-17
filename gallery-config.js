/**
 * Gallery configuration — image list loaded from API.
 * No hardcoded image URLs. All images come from the API response.
 */

const GALLERY_CONFIG = {
  // API endpoint: GET returns { images: string[], count: number, cursor: string|null }
  // Optional: append ?cursor=... for next page
  GALLERY_API_URL: 'https://still-bar-f124.moonletters393.workers.dev/api/images',
};
