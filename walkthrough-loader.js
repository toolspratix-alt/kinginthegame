/* Performance-safe official GameMonetize walkthrough loader. */

(() => {
  
  const block = document.getElementById('game-walkthrough');
  
  const mount = document.getElementById('gamemonetize-video');
  
  if (!block || !mount) return;
  

  
  const gameid = block.dataset.gameid;
  
  const title = window.KITG_GAME?.title || document.getElementById('game-title')?.textContent?.trim() || document.title;
  
  let loaded = false;
  

  
  const markUnavailable = () => {
    
    block.classList.add('walkthrough-unavailable');
    
    const status = mount.querySelector('.walkthrough-status');
    
    if (status) status.textContent = 'The official walkthrough is temporarily unavailable.';
    
  };
  

  
  const appendScript = (src, id, done) => {
    
    const existing = document.getElementById(id);
    
    if (existing) {
      
      if (window.jQuery) done();
      
      return;
      
    }
    
    const script = document.createElement('script');
    
    script.src = src;
    
    script.id = id;
    
    script.async = true;
    
    script.onload = done;
    
    script.onerror = markUnavailable;
    
    document.head.appendChild(script);
    
  };
  

  
  const loadOfficialPlayer = () => {
    
    if (loaded || !gameid || !window.jQuery) return;
    
    loaded = true;
    
    window.VIDEO_OPTIONS = {
      
      game: title,
      
      gameid,
      
      width: '100%',
      
      height: '480px',
      
      color: '#0b5cff',
      
      getAds: 'true'
        
    };
    
    // GameMonetize video.js uses jQuery's $ function internally.
    
    appendScript('https://api.gamemonetize.com/video.js', 'gamemonetize-video-api', () => {});
    
  };
  

  
  const start = () => {
    
    appendScript('https://code.jquery.com/jquery-3.7.1.min.js', 'gamemonetize-jquery', loadOfficialPlayer);
    
  };
  

  
  if ('IntersectionObserver' in window) {
    
    const observer = new IntersectionObserver(entries => {
      
      if (entries.some(entry => entry.isIntersecting)) {
        
        start();
        
        observer.disconnect();
        
      }
      
    }, { rootMargin: '300px 0px' });
    
    observer.observe(block);
    
  } else {
    
    start();
    
  }
  
})();



























































