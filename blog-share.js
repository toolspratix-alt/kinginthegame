(() => {
  const panels = document.querySelectorAll('[data-blog-share]');
  if (!panels.length) return;
  const canonical = document.querySelector('link[rel="canonical"]')?.href || window.location.href.split('#')[0];
  const title = document.querySelector('h1')?.textContent?.trim() || document.title;
  const enc = encodeURIComponent;
  const targets = {
    x: `https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(canonical)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${enc(canonical)}`,
    whatsapp: `https://wa.me/?text=${enc(`${title} ${canonical}`)}`,
    telegram: `https://t.me/share/url?url=${enc(canonical)}&text=${enc(title)}`,
    reddit: `https://www.reddit.com/submit?url=${enc(canonical)}&title=${enc(title)}`,
  };
  for (const panel of panels) {
    panel.querySelectorAll('[data-share-platform]').forEach(link => {
      const target = targets[link.dataset.sharePlatform];
      if (target) link.href = target;
    });
    const status = panel.querySelector('[data-share-status]');
    const copyButton = panel.querySelector('[data-share-copy]');
    const nativeButton = panel.querySelector('[data-share-native]');
    const announce = value => { if (status) status.textContent = value; };
    if (navigator.share && nativeButton) {
      nativeButton.hidden = false;
      nativeButton.addEventListener('click', async () => {
        try {
          await navigator.share({ title, url: canonical });
          if (typeof gtag === 'function') gtag('event', 'share', { method: 'native', content_type: 'blog_article', item_id: panel.dataset.postSlug });
        } catch (error) {
          if (error?.name !== 'AbortError') announce('');
        }
      });
    }
    copyButton?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(canonical);
        const original = copyButton.textContent;
        copyButton.textContent = copyButton.dataset.copiedLabel || original;
        announce(copyButton.dataset.copiedLabel || original);
        window.setTimeout(() => { copyButton.textContent = original; announce(''); }, 1800);
        if (typeof gtag === 'function') gtag('event', 'share', { method: 'copy_link', content_type: 'blog_article', item_id: panel.dataset.postSlug });
      } catch {
        announce(canonical);
      }
    });
    panel.querySelectorAll('[data-share-platform]').forEach(link => {
      link.addEventListener('click', () => {
        if (typeof gtag === 'function') gtag('event', 'share', { method: link.dataset.sharePlatform, content_type: 'blog_article', item_id: panel.dataset.postSlug });
      });
    });
  }
})();
