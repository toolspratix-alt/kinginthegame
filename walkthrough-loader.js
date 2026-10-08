/* Performance-safe official GameMonetize walkthrough loader. */
(() => {
  const block = document.getElementById('game-walkthrough');
  const mount = document.getElementById('gamemonetize-video');
  if (!block || !mount) return;
  const gameid = block.dataset.gameid;
  let loaded = false;

  const appendScript = (src, id, done) => {
    const existing = document.getElementById(id);
    if (existing) { done(); return; }
    const script = document.createElement('script');
    script.src = src;
    script.id = id;
    script.async = true;
    script.onload = done;
    script.onerror = () => block.classList.add('walkthrough-unavailable');
    document.head.appendChild(script);
  };

  const loadOfficialPlayer = () => {
    if (loaded || !gameid) return;
    loaded = true;
    window.VIDEO_OPTIONS = {
      gameid: gameid,
      width: '100%',
      height: '480px',
      color: '#0b5cff',
      getAds: 'true'
    };
    // GameMonetize video.js uses jQuery's $ function internally.
    appendScript('https://api.gamemonetize.com/video.js', 'gamemonetize-video-api', () => {});
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        appendScript('https://code.jquery.com/jquery-3.7.1.min.js', 'gamemonetize-jquery', loadOfficialPlayer);
        observer.disconnect();
      }
    }, { rootMargin: '0px' });
    observer.observe(block);
  } else {
    appendScript('https://code.jquery.com/jquery-3.7.1.min.js', 'gamemonetize-jquery', loadOfficialPlayer);
  }
})();
