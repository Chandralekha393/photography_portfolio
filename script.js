/**
 * Lens & Light — Photography Portfolio
 * Smooth interactions, UX enhancements, and images from Worker API
 */

const HOME_GALLERY_LAYOUTS = ['gallery-item--tall', '', '', 'gallery-item--wide', '', 'gallery-item--tall'];

function escapeHtml(s) {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

async function loadHomeImages() {
  const apiUrl = typeof GALLERY_CONFIG !== 'undefined' && GALLERY_CONFIG.GALLERY_API_URL
    ? GALLERY_CONFIG.GALLERY_API_URL
    : '';

  if (!apiUrl) return;

  try {
    const res = await fetch(apiUrl);
    if (!res.ok) return;
    const data = await res.json();
    const images = Array.isArray(data.images) ? data.images : [];
    if (images.length === 0) return;

    // Hero background — first image
    const heroBg = document.getElementById('hero-bg');
    if (heroBg) {
      const img = document.createElement('img');
      img.src = images[0];
      img.alt = '';
      img.setAttribute('fetchpriority', 'high');
      heroBg.insertBefore(img, heroBg.firstElementChild);
    }

    // Home gallery grid — first 6 images, lazy loaded
    const grid = document.getElementById('home-gallery-grid');
    if (grid) {
      const placeholder = grid.querySelector('.gallery-grid-placeholder');
      if (placeholder) placeholder.remove();
      grid.removeAttribute('aria-busy');

      const needed = 6;
      for (let i = 0; i < needed; i++) {
        const src = images[i % images.length];
        const layout = HOME_GALLERY_LAYOUTS[i] || '';
        const article = document.createElement('article');
        article.className = 'gallery-item' + (layout ? ' ' + layout : '');
        article.innerHTML = `
          <img src="${escapeHtml(src)}" alt="" loading="lazy" decoding="async">
        `;
        grid.appendChild(article);
      }
    }

    // About section — use second image (or first if only one)
    const aboutEl = document.getElementById('about-image');
    if (aboutEl) {
      const src = images.length > 1 ? images[1] : images[0];
      const img = document.createElement('img');
      img.src = src;
      img.alt = 'Photographer at work';
      img.loading = 'lazy';
      img.decoding = 'async';
      aboutEl.appendChild(img);
    }

    // Fade-in animation for dynamically added gallery items
    if (typeof window.__observeHomeGallery === 'function') {
      const items = document.querySelectorAll('#home-gallery-grid .gallery-item');
      window.__observeHomeGallery(Array.from(items));
    }
  } catch (err) {
    console.error('Home images fetch failed:', err);
    const grid = document.getElementById('home-gallery-grid');
    if (grid) {
      const placeholder = grid.querySelector('.gallery-grid-placeholder');
      if (placeholder) placeholder.textContent = 'Gallery images could not be loaded.';
      grid.removeAttribute('aria-busy');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Mobile navigation toggle
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  navToggle?.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    navToggle.setAttribute('aria-expanded', navLinks.classList.contains('active'));
  });

  // Close mobile menu when clicking a link
  navLinks?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
      navToggle?.setAttribute('aria-expanded', 'false');
    });
  });

  // Nav scroll effect — add background when scrolled
  const nav = document.querySelector('.nav');

  const handleScroll = () => {
    if (window.scrollY > 50) {
      nav?.classList.add('scrolled');
    } else {
      nav?.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // Run on load

  // Intersection Observer — fade in elements on scroll
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -80px 0px',
    threshold: 0.1,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe about and contact
  document.querySelectorAll('.about-inner, .contact-inner').forEach((el) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
    observer.observe(el);
  });

  // Gallery items are added by loadHomeImages(); observe them after inject
  const observeGalleryItems = (items) => {
    items.forEach((el, index) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(24px)';
      el.style.transition = 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
      el.style.transitionDelay = `${index * 0.08}s`;
      observer.observe(el);
    });
  };
  window.__observeHomeGallery = observeGalleryItems;

  // Add visible class styles
  const style = document.createElement('style');
  style.textContent = `
    .gallery-item.visible,
    .about-inner.visible,
    .contact-inner.visible {
      opacity: 1 !important;
      transform: translateY(0) !important;
    }
  `;
  document.head.appendChild(style);

  // Load images from Worker API (hero, gallery grid, about)
  loadHomeImages();
});
