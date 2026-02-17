/**
 * Gallery — Fetches images from API, responsive grid, lazy loading, lightbox.
 * API: GET returns { images: string[], count: number, cursor: string|null }
 * No hardcoded image URLs.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const masonry = document.querySelector('.gallery-masonry');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.querySelector('.lightbox-img');
  const lightboxCaption = document.querySelector('.lightbox-caption');
  const lightboxClose = document.querySelector('.lightbox-close');

  const categoryLabel = (cat) => (cat || 'all').charAt(0).toUpperCase() + (cat || '').slice(1);

  function titleFromUrl(url) {
    try {
      const path = new URL(url).pathname;
      const name = path.replace(/^.*\//, '').replace(/\.[^.]+$/, '');
      return name.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Image';
    } catch {
      return 'Image';
    }
  }

  function categoryFromUrl(url) {
    try {
      const path = new URL(url).pathname.toLowerCase();
      if (path.includes('/landscapes/') || /\/landscapes$/.test(path)) return 'landscapes';
      if (path.includes('/wildlife/') || /\/wildlife$/.test(path)) return 'wildlife';
      if (path.includes('/nightscapes/') || /\/nightscapes$/.test(path)) return 'nightscapes';
    } catch {}
    return 'all';
  }

  function escapeHtml(s) {
    return (s || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;');
  }

  const setMasonryState = (state, message) => {
    if (!masonry) return;
    masonry.classList.remove('loading', 'error');
    if (state) masonry.classList.add(state);
    masonry.innerHTML = state ? `<p class="gallery-state-message">${escapeHtml(message)}</p>` : masonry.innerHTML;
  };

  const appendCards = (imageUrls) => {
    if (!masonry || !imageUrls.length) return;
    masonry.classList.remove('loading', 'error');
    const fragment = document.createDocumentFragment();
    imageUrls.forEach((src) => {
      const category = categoryFromUrl(src);
      const title = titleFromUrl(src);
      const article = document.createElement('article');
      article.className = 'gallery-card orientation-landscape';
      article.dataset.category = category;
      article.innerHTML = `
        <img src="${escapeHtml(src)}" alt="${escapeHtml(title)}" loading="lazy" decoding="async">
        <div class="gallery-card-overlay">
          <span class="gallery-card-category">${escapeHtml(categoryLabel(category))}</span>
          <h3>${escapeHtml(title)}</h3>
        </div>
      `;
      fragment.appendChild(article);
    });
    const sentinel = document.getElementById('gallery-load-more');
    if (sentinel) masonry.insertBefore(fragment, sentinel);
    else masonry.appendChild(fragment);
  };

  const apiUrl = typeof GALLERY_CONFIG !== 'undefined' && GALLERY_CONFIG.GALLERY_API_URL
    ? GALLERY_CONFIG.GALLERY_API_URL
    : '';

  if (!apiUrl) {
    setMasonryState('error', 'Gallery API URL is not configured.');
    return;
  }

  let cursor = null;
  let loadingMore = false;

  const fetchPage = async (nextCursor) => {
    const url = nextCursor ? `${apiUrl}?cursor=${encodeURIComponent(nextCursor)}` : apiUrl;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };

  const loadMore = async () => {
    if (loadingMore || cursor === undefined) return; // undefined = no more pages
    loadingMore = true;
    const sentinel = document.getElementById('gallery-load-more');
    if (sentinel) sentinel.classList.add('loading');
    try {
      const data = await fetchPage(cursor);
      const list = Array.isArray(data.images) ? data.images : [];
      cursor = data.cursor != null && data.cursor !== '' ? data.cursor : undefined;
      appendCards(list);
      if (sentinel) {
        sentinel.classList.remove('loading');
        sentinel.style.display = cursor !== undefined ? '' : 'none';
      }
    } catch (err) {
      console.error('Gallery fetch failed:', err);
      if (sentinel) sentinel.classList.remove('loading');
    } finally {
      loadingMore = false;
    }
  };

  try {
    const data = await fetchPage(null);
    const list = Array.isArray(data.images) ? data.images : [];
    cursor = data.cursor != null && data.cursor !== '' ? data.cursor : undefined;
    if (list.length) {
      appendCards(list);
      if (cursor !== undefined) {
        const sentinel = document.createElement('div');
        sentinel.id = 'gallery-load-more';
        sentinel.className = 'gallery-load-more';
        sentinel.setAttribute('aria-hidden', 'true');
        masonry.appendChild(sentinel);
        const observer = new IntersectionObserver(
          (entries) => {
            if (entries[0]?.isIntersecting) loadMore();
          },
          { rootMargin: '200px', threshold: 0 }
        );
        observer.observe(sentinel);
      }
    } else {
      setMasonryState('', 'No images to show.');
    }
  } catch (err) {
    console.error('Gallery fetch failed:', err);
    setMasonryState('error', 'Could not load gallery. Please try again later.');
    return;
  }

  if (filterBtns.length && masonry) {
    const filterByCategory = (category) => {
      masonry.querySelectorAll('.gallery-card').forEach((card) => {
        const cardCategory = card.dataset.category;
        const show = category === 'all' || cardCategory === category;
        card.classList.toggle('hidden', !show);
        card.classList.toggle('visible', show);
        card.style.display = show ? '' : 'none';
      });
    };
    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        filterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        filterByCategory(btn.dataset.category);
      });
    });
  }

  const openLightbox = (imgSrc, alt, caption) => {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = imgSrc;
    lightboxImg.alt = alt || '';
    lightboxCaption.textContent = caption || '';
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');
  };

  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
  };

  masonry?.addEventListener('click', (e) => {
    const card = e.target.closest('.gallery-card');
    if (!card || card.classList.contains('hidden')) return;
    const img = card.querySelector('img');
    const captionEl = card.querySelector('.gallery-card-overlay h3');
    if (img) openLightbox(img.src, img.alt, captionEl?.textContent || '');
  });

  lightboxClose?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox?.classList.contains('open')) closeLightbox();
  });
});
