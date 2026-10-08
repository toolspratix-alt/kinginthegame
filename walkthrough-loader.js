/* GameMonetize Walkthroughs: lazy-load the official video player near the game article. */
(() => {
  const block = document.getElementById('game-walkthrough');
  if (!block) return;
  const mount = document.getElementById('gamemonetize-video');
  const gameid = block.dataset.gameid;
  if (!mount || !gameid) return;
  let loaded = false;
  const load = () => {
    if (loaded) return;
    loaded = true;
    window.VIDEO_OPTIONS = {
      gameid,
      width: '100%',
      height: '480px',
      color: '#0b5cff',
      getAds: 'true'
    };
    const script = document.createElement('script');
    script.id = 'gamemonetize-video-api';
    script.src = 'https://api.gamemonetize.com/video.js';
    script.async = true;
    script.onerror = () => {
      block.classList.add('walkthrough-unavailable');
      block.querySelector('.walkthrough-status').textContent = 'Walkthrough temporarily unavailable.';
    };
    document.head.appendChild(script);
  };
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        load();
        observer.disconnect();
      }
    }, { rootMargin: '500px 0px' });
    observer.observe(block);
  } else {
    load();
  }
})();
