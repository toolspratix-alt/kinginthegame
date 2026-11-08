(() => {
  const labels = {"en":"Blog","tr":"Blog","de":"Blog","es":"Blog","fr":"Blog","it":"Blog","pt":"Blog","pl":"Blog","nl":"Blog","ja":"ブログ","ko":"블로그","zh":"博客","ar":"المدونة","ru":"Блог","id":"Blog","vi":"Blog","th":"บล็อก","hi":"ब्लॉग"};
  const pathFor = lang => (lang === 'en' ? '' : '/' + lang) + '/blog.html';
  const update = () => {
    const selector = document.getElementById('languageSelect');
    const lang = (selector && selector.value) || document.documentElement.lang || localStorage.getItem('kitg-language') || 'en';
    const code = Object.prototype.hasOwnProperty.call(labels, lang) ? lang : 'en';
    document.querySelectorAll('[data-blog-nav]').forEach(link => {
      link.href = pathFor(code);
      link.textContent = labels[code];
    });
  };
  update();
  document.getElementById('languageSelect')?.addEventListener('change', update);
})();
