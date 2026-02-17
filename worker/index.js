/**
 * Cloudflare Worker — Gallery API
 * GET / → returns JSON { images: [ { path, title?, category?, orientation? }, ... ] }
 * Lists objects from R2 (IMAGES binding), filters to image extensions, derives category from path.
 */

const IMAGE_EXT = /\.(jpg|jpeg|png|webp|gif)$/i;

function corsHeaders(origin = '*') {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function toTitle(key) {
  const base = key.replace(/\.[^.]+$/, '').replace(/^.*\//, '');
  return base.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function categoryFromPath(key) {
  const parts = key.split('/').filter(Boolean);
  if (parts.length > 1) {
    const folder = parts[0].toLowerCase();
    if (['landscapes', 'wildlife', 'nightscapes'].includes(folder)) return folder;
    return folder;
  }
  return 'landscapes';
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    if (request.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }

    const origin = request.headers.get('Origin') || '*';

    try {
      const list = await env.IMAGES.list({ limit: 1000 });
      const objects = list.objects || [];
      const images = objects
        .filter((o) => o.key && IMAGE_EXT.test(o.key))
        .map((o) => ({
          path: o.key,
          title: toTitle(o.key),
          category: categoryFromPath(o.key),
          orientation: 'landscape',
        }));

      return new Response(
        JSON.stringify({ images }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=60',
            ...corsHeaders(origin),
          },
        }
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ error: 'Failed to list images', detail: String(err.message) }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
        }
      );
    }
  },
};
