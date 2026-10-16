(() => {
  'use strict';

  const lang = (document.documentElement.lang || 'en').toLowerCase().split('-')[0];
  const labels = {
    en: { title: 'Share this game', subtitle: 'Help another player discover it', native: 'Share', copy: 'Copy link', copied: 'Copied', more: 'More' },
    tr: { title: 'Bu oyunu paylaş', subtitle: 'Başka bir oyuncunun keşfetmesine yardımcı ol', native: 'Paylaş', copy: 'Bağlantıyı kopyala', copied: 'Kopyalandı', more: 'Diğer' },
    de: { title: 'Dieses Spiel teilen', subtitle: 'Hilf anderen Spielern, es zu entdecken', native: 'Teilen', copy: 'Link kopieren', copied: 'Kopiert', more: 'Mehr' },
    es: { title: 'Comparte este juego', subtitle: 'Ayuda a otros jugadores a descubrirlo', native: 'Compartir', copy: 'Copiar enlace', copied: 'Copiado', more: 'Más' },
    fr: { title: 'Partager ce jeu', subtitle: 'Aidez un autre joueur à le découvrir', native: 'Partager', copy: 'Copier le lien', copied: 'Copié', more: 'Plus' },
    it: { title: 'Condividi questo gioco', subtitle: 'Aiuta un altro giocatore a scoprirlo', native: 'Condividi', copy: 'Copia link', copied: 'Copiato', more: 'Altro' },
    pt: { title: 'Compartilhe este jogo', subtitle: 'Ajude outro jogador a descobri-lo', native: 'Compartilhar', copy: 'Copiar link', copied: 'Copiado', more: 'Mais' },
    ru: { title: 'Поделиться игрой', subtitle: 'Помогите другому игроку открыть её', native: 'Поделиться', copy: 'Копировать ссылку', copied: 'Скопировано', more: 'Ещё' },
    ja: { title: 'このゲームを共有', subtitle: '他のプレイヤーにも教えよう', native: '共有', copy: 'リンクをコピー', copied: 'コピーしました', more: 'その他' },
    ko: { title: '이 게임 공유', subtitle: '다른 플레이어에게 알려보세요', native: '공유', copy: '링크 복사', copied: '복사됨', more: '더보기' },
    zh: { title: '分享这款游戏', subtitle: '推荐给其他玩家', native: '分享', copy: '复制链接', copied: '已复制', more: '更多' },
    ar: { title: 'شارك هذه اللعبة', subtitle: 'ساعد لاعبًا آخر على اكتشافها', native: 'مشاركة', copy: 'نسخ الرابط', copied: 'تم النسخ', more: 'المزيد' },
    id: { title: 'Bagikan game ini', subtitle: 'Bantu pemain lain menemukannya', native: 'Bagikan', copy: 'Salin tautan', copied: 'Tersalin', more: 'Lainnya' },
    vi: { title: 'Chia sẻ trò chơi này', subtitle: 'Giúp người chơi khác khám phá', native: 'Chia sẻ', copy: 'Sao chép liên kết', copied: 'Đã sao chép', more: 'Thêm' },
    th: { title: 'แชร์เกมนี้', subtitle: 'แนะนำให้ผู้เล่นคนอื่นรู้จัก', native: 'แชร์', copy: 'คัดลอกลิงก์', copied: 'คัดลอกแล้ว', more: 'เพิ่มเติม' },
    hi: { title: 'यह गेम साझा करें', subtitle: 'दूसरे खिलाड़ियों को इसे खोजने में मदद करें', native: 'शेयर', copy: 'लिंक कॉपी करें', copied: 'कॉपी हो गया', more: 'और' }
  };
  const t = labels[lang] || labels.en;
  const title = document.querySelector('#game-title')?.textContent?.trim() || document.title;
  const url = window.location.href.split('#')[0];
  const image = document.querySelector('meta[property="og:image"]')?.content || `${window.location.origin}/assets/king-logo.webp`;
  const text = `${title} — King in the Game`;
  const enc = encodeURIComponent;
  const links = [
    { key: 'x', label: 'X', href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}` },
    { key: 'facebook', label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
    { key: 'pinterest', label: 'Pinterest', href: `https://pinterest.com/pin/create/button/?url=${enc(url)}&media=${enc(image)}&description=${enc(text)}` },
    { key: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/?text=${enc(`${text} ${url}`)}` },
    { key: 'reddit', label: 'Reddit', href: `https://www.reddit.com/submit?url=${enc(url)}&title=${enc(text)}` },
    { key: 'telegram', label: 'Telegram', href: `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}` },
    { key: 'linkedin', label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}` }
  ];

  function button(link) {
    const a = document.createElement('a');
    a.className = `social-share-button social-share-${link.key}`;
    a.href = link.href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.dataset.platform = link.label;
    a.innerHTML = `<span aria-hidden="true">${link.key === 'x' ? '𝕏' : link.label.slice(0, 1)}</span><b>${link.label}</b>`;
    a.addEventListener('click', () => {
      if (typeof window.gtag === 'function') window.gtag('event', 'share', { method: link.label, content_type: 'game', item_id: title });
    });
    return a;
  }

  function mount() {
    if (document.querySelector('.social-share-panel')) return;
    const marker = document.querySelector('#play-note') || document.querySelector('.game-shell');
    if (!marker) return;
    const panel = document.createElement('section');
    panel.className = 'social-share-panel';
    panel.setAttribute('aria-labelledby', 'social-share-title');
    panel.innerHTML = `<div class="social-share-copy"><span class="mono">DISCOVER TOGETHER</span><h2 id="social-share-title">${t.title}</h2><p>${t.subtitle}</p></div><div class="social-share-actions" role="group" aria-label="${t.title}"></div>`;
    const actions = panel.querySelector('.social-share-actions');
    links.forEach((link) => actions.appendChild(button(link)));

    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'social-share-button social-share-copy-link';
    copy.innerHTML = `<span aria-hidden="true">⧉</span><b>${t.copy}</b>`;
    copy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        const input = document.createElement('input');
        input.value = url; document.body.appendChild(input); input.select(); document.execCommand('copy'); input.remove();
      }
      copy.classList.add('is-copied');
      copy.querySelector('b').textContent = t.copied;
      setTimeout(() => { copy.classList.remove('is-copied'); copy.querySelector('b').textContent = t.copy; }, 1800);
    });
    actions.appendChild(copy);

    if (navigator.share) {
      const native = document.createElement('button');
      native.type = 'button';
      native.className = 'social-share-button social-share-native';
      native.innerHTML = `<span aria-hidden="true">↗</span><b>${t.native}</b>`;
      native.addEventListener('click', () => navigator.share({ title, text, url }).catch(() => {}));
      actions.prepend(native);
    }

    marker.insertAdjacentElement('afterend', panel);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();
