#!/usr/bin/env python3
"""Build crawlable static blog pages for King in the Game."""
from __future__ import annotations

import html
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
BASE_URL = "https://www.kinginthegame.com"
LOCALES = ["en", "tr", "de", "es", "fr", "it", "pt", "pl", "nl", "ja", "ko", "zh", "ar", "ru", "id", "vi", "th", "hi"]
LANGUAGE_NAMES = {
    "en": "English", "tr": "Türkçe", "de": "Deutsch", "es": "Español", "fr": "Français",
    "it": "Italiano", "pt": "Português", "pl": "Polski", "nl": "Nederlands", "ja": "日本語",
    "ko": "한국어", "zh": "简体中文", "ar": "العربية", "ru": "Русский", "id": "Bahasa Indonesia",
    "vi": "Tiếng Việt", "th": "ไทย", "hi": "हिन्दी",
}


def esc(value: Any) -> str:
    return html.escape(str(value), quote=True)


def public_path(locale: str, route: str) -> str:
    prefix = "" if locale == "en" else f"/{locale}"
    return f"{prefix}/{route.lstrip('/')}"


def absolute(path: str) -> str:
    return BASE_URL + path


def inline_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")


def read_content() -> tuple[dict[str, dict[str, Any]], dict[str, dict[str, Any]]]:
    source = json.loads((ROOT / "content/blog/source-en.json").read_text(encoding="utf-8"))
    games = {item["id"]: item for item in json.loads((ROOT / "games.json").read_text(encoding="utf-8"))}
    documents: dict[str, dict[str, Any]] = {"en": source}
    for locale in LOCALES[1:]:
        path = ROOT / "content/blog/locales" / f"{locale}.json"
        if not path.exists():
            raise FileNotFoundError(f"Missing locale content: {path}")
        document = json.loads(path.read_text(encoding="utf-8"))
        if document.get("locale") != locale:
            raise ValueError(f"Locale code mismatch in {path}")
        if [p["slug"] for p in document["posts"]] != [p["slug"] for p in source["posts"]]:
            raise ValueError(f"Post list differs from English source in {path}")
        documents[locale] = document
    return documents, games


def get_cover(post: dict[str, Any], games: dict[str, dict[str, Any]]) -> str:
    if post.get("slug") == "budget-gaming-setup":
        editorial_cover = "/assets/blog-budget-gaming-setup.webp"
        if (ROOT / editorial_cover.lstrip("/")).exists():
            return editorial_cover
    for item in post.get("game_links", []):
        record = games.get(item["id"], {})
        cover = record.get("cover") or record.get("screenshot")
        if cover and (ROOT / cover.lstrip("/")).exists():
            return cover if cover.startswith("/") else "/" + cover
    return "/assets/king-logo.webp"


def game_url(locale: str, game_id: str) -> str:
    rel = Path(locale) / "games" / f"{game_id}.html" if locale != "en" else Path("games") / f"{game_id}.html"
    if (ROOT / rel).exists():
        return "/" + rel.as_posix()
    # Some catalog games have no translated detail page; keep the link valid via English.
    fallback = Path("games") / f"{game_id}.html"
    if (ROOT / fallback).exists():
        return "/" + fallback.as_posix()
    raise FileNotFoundError(f"No game page for {game_id}")


def language_switcher(locale: str, current_route: str) -> str:
    items = []
    for code in LOCALES:
        href = public_path(code, current_route)
        current = ' aria-current="page"' if code == locale else ""
        items.append(f'<a href="{esc(href)}" lang="{code}"{current}>{esc(LANGUAGE_NAMES[code])}</a>')
    return (
        '<details class="blog-language"><summary>' + esc(LANGUAGE_NAMES[locale]) + '</summary>'
        '<div class="blog-language-menu">' + "".join(items) + '</div></details>'
    )


def header(locale: str, data: dict[str, Any], current_route: str) -> str:
    ui = data["ui"]
    home = "/tr/" if locale == "tr" else "/"
    games = "/tr/#games" if locale == "tr" else "/#games"
    guides = public_path(locale, "guides.html")
    blog = public_path(locale, "blog.html")
    return f'''<header class="portal-header blog-header">
  <a class="portal-brand" href="{esc(home)}"><img src="/assets/king-logo.webp" alt=""><span>King in the <b>Game</b><small>PLAY. DISCOVER. REPEAT.</small></span></a>
  <nav aria-label="Primary navigation">
    <a href="{esc(home)}">{esc(ui['nav_home'])}</a><a href="{esc(games)}">{esc(ui['nav_games'])}</a>
    <a href="{esc(guides)}">{esc(ui['nav_guides'])}</a><a href="{esc(blog)}" data-blog-nav>{esc(ui['nav_blog'])}</a>
    <a href="/about.html">{esc(ui['nav_about'])}</a>
  </nav>
  {language_switcher(locale, current_route)}
</header>'''


def footer(locale: str, data: dict[str, Any]) -> str:
    ui = data["ui"]
    blog = public_path(locale, "blog.html")
    return f'''<footer class="portal-footer blog-footer">
  <div class="portal-brand"><img src="/assets/king-logo.webp" alt=""><span>King in the <b>Game</b><small>PLAY. DISCOVER. REPEAT.</small></span></div>
  <div><a href="/about.html">{esc(ui['footer_about'])}</a><span>{esc(ui['footer_tagline'])}</span></div>
  <span class="mono">© 2026 KING IN THE GAME</span>
  <div class="legal-links"><a href="{esc(blog)}" data-blog-nav>{esc(ui['nav_blog'])}</a><a href="/guides.html">{esc(ui['nav_guides'])}</a><a href="/privacy.html">{esc(ui['footer_privacy'])}</a><a href="/terms.html">{esc(ui['footer_terms'])}</a><a href="/contact.html">{esc(ui['footer_contact'])}</a></div>
</footer>'''


def head(locale: str, title: str, description: str, canonical_path: str, cover: str,
         page_type: str, schema: dict[str, Any], all_paths: dict[str, str]) -> str:
    canonical = absolute(canonical_path)
    image = absolute(cover)
    alternates = "".join(
        f'<link rel="alternate" hreflang="{code}" href="{esc(absolute(path))}">'
        for code, path in all_paths.items()
    )
    alternates += f'<link rel="alternate" hreflang="x-default" href="{esc(absolute(all_paths["en"]))}">'
    return f'''<!doctype html>
<html lang="{locale}" dir="{'rtl' if locale == 'ar' else 'ltr'}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)}</title><meta name="description" content="{esc(description)}">
<link rel="canonical" href="{esc(canonical)}">{alternates}
<meta property="og:type" content="{page_type}"><meta property="og:title" content="{esc(title)}"><meta property="og:description" content="{esc(description)}"><meta property="og:url" content="{esc(canonical)}"><meta property="og:site_name" content="King in the Game"><meta property="og:image" content="{esc(image)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{esc(title)}"><meta name="twitter:description" content="{esc(description)}"><meta name="twitter:image" content="{esc(image)}">
<meta name="theme-color" content="#080b12"><link rel="icon" href="/assets/king-logo.webp" type="image/webp">
<link rel="stylesheet" href="/portal.css"><link rel="stylesheet" href="/guides.css?v=20261104"><link rel="stylesheet" href="/blog.css?v=20261109">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
<script type="application/ld+json">{inline_json(schema)}</script>
</head>'''


def post_schema(locale: str, post: dict[str, Any], url: str, cover: str) -> dict[str, Any]:
    canonical = absolute(url)
    body_words = " ".join(
        [post["title"], post["excerpt"]]
        + [p for section in post["sections"] for p in [section["heading"], *section["paragraphs"]]]
        + [part for faq in post["faq"] for part in [faq["question"], faq["answer"]]]
    )
    return {
        "@context": "https://schema.org", "@type": "BlogPosting", "headline": post["title"],
        "description": post["meta_description"], "url": canonical, "mainEntityOfPage": canonical,
        "image": absolute(cover), "datePublished": post["date_published"], "dateModified": post["date_published"],
        "inLanguage": locale, "wordCount": len(body_words.split()),
        "author": {"@type": "Organization", "name": "King in the Game"},
        "publisher": {"@type": "Organization", "name": "King in the Game", "logo": {"@type": "ImageObject", "url": absolute("/assets/king-logo.webp")}},
    }


def share_panel(locale: str, post: dict[str, Any], ui: dict[str, str]) -> str:
    return f'''<section class="blog-share" data-blog-share data-post-slug="{esc(post['slug'])}" aria-label="{esc(ui['share_title'])}">
  <span class="mono">{esc(ui['share_title'])}</span>
  <div class="blog-share-actions">
    <a href="#" data-share-platform="x" target="_blank" rel="noopener noreferrer">{esc(ui['share_x'])}</a>
    <a href="#" data-share-platform="facebook" target="_blank" rel="noopener noreferrer">{esc(ui['share_facebook'])}</a>
    <a href="#" data-share-platform="whatsapp" target="_blank" rel="noopener noreferrer">{esc(ui['share_whatsapp'])}</a>
    <a href="#" data-share-platform="telegram" target="_blank" rel="noopener noreferrer">{esc(ui['share_telegram'])}</a>
    <a href="#" data-share-platform="reddit" target="_blank" rel="noopener noreferrer">{esc(ui['share_reddit'])}</a>
    <button type="button" data-share-native hidden>{esc(ui['share_native'])}</button>
    <button type="button" data-share-copy data-copied-label="{esc(ui['share_copied'])}">{esc(ui['share_copy'])}</button>
  </div><span class="blog-share-status" data-share-status aria-live="polite"></span>
</section>'''


def article_card(locale: str, post: dict[str, Any], games: dict[str, dict[str, Any]], ui: dict[str, str]) -> str:
    href = public_path(locale, f"blog/{post['slug']}.html")
    cover = get_cover(post, games)
    return f'''<article class="blog-card">
  <a class="blog-card-image" href="{esc(href)}"><img src="{esc(cover)}" loading="lazy" alt="{esc(post['title'])}"></a>
  <div class="blog-card-copy"><span class="blog-category">{esc(post['category'])}</span>
    <h2><a href="{esc(href)}">{esc(post['title'])}</a></h2><p>{esc(post['excerpt'])}</p>
    <div class="blog-card-meta"><span>{post['minutes']} {esc(ui['read_time'])}</span><a href="{esc(href)}">{esc(ui['read_article'])} <span aria-hidden="true">↗</span></a></div>
  </div>
</article>'''


def archive_page(locale: str, data: dict[str, Any], games: dict[str, dict[str, Any]], documents: dict[str, dict[str, Any]]) -> str:
    home, ui = data["home"], data["ui"]
    route = "blog.html"
    canonical_path = public_path(locale, route)
    all_paths = {code: public_path(code, route) for code in LOCALES}
    cards = "".join(article_card(locale, post, games, ui) for post in data["posts"])
    cover = get_cover(data["posts"][0], games)
    item_list = [{"@type": "ListItem", "position": i, "url": absolute(public_path(locale, f"blog/{p['slug']}.html")), "name": p["title"]} for i, p in enumerate(data["posts"], 1)]
    schema = {"@context": "https://schema.org", "@type": "CollectionPage", "name": ui["nav_blog"], "description": home["meta_description"], "url": absolute(canonical_path), "inLanguage": locale, "mainEntity": {"@type": "ItemList", "numberOfItems": len(item_list), "itemListElement": item_list}, "publisher": {"@type": "Organization", "name": "King in the Game"}}
    prefix = "<br>".join(esc(part) for part in home["title"].split("\n"))
    return (head(locale, home["meta_title"], home["meta_description"], canonical_path, cover, "website", schema, all_paths)
        + "<body>" + header(locale, data, route) + f'''<main class="blog-main blog-archive" id="main-content">
<section class="blog-hero"><span class="portal-eyebrow"><i></i>{esc(home['eyebrow'])}</span><h1>{prefix}</h1><p>{esc(home['lead'])}</p></section>
<section class="blog-articles" aria-labelledby="blog-latest"><div class="blog-section-head"><span class="mono" id="blog-latest">{esc(home['latest'])}</span><span class="blog-count">{len(data['posts'])}</span></div><div class="blog-grid">{cards}</div></section>
<aside class="blog-disclosure"><strong>{esc(home['disclosure_title'])}</strong><p>{esc(home['disclosure'])}</p></aside>
</main>''' + footer(locale, data)
        + f'<script>localStorage.setItem("kitg-language",{json.dumps(locale)});</script><script src="/blog-nav.js" defer></script></body></html>')


def article_page(locale: str, data: dict[str, Any], post: dict[str, Any], games: dict[str, dict[str, Any]]) -> str:
    ui = data["ui"]
    route = f"blog/{post['slug']}.html"
    canonical_path = public_path(locale, route)
    all_paths = {code: public_path(code, route) for code in LOCALES}
    cover = get_cover(post, games)
    schema = post_schema(locale, post, canonical_path, cover)
    sections = "".join(
        f'<section class="blog-content-section"><h2>{esc(section["heading"])}</h2>'
        + "".join(f"<p>{esc(paragraph)}</p>" for paragraph in section["paragraphs"])
        + "</section>" for section in post["sections"]
    )
    faqs = "".join(f'<details><summary>{esc(item["question"])}</summary><p>{esc(item["answer"])}</p></details>' for item in post["faq"])
    games_html = ""
    if post.get("game_links"):
        cards = "".join(
            f'<li><a class="blog-game-link" href="{esc(game_url(locale, game["id"]))}"><strong>{esc(game["title"])}</strong><span>{esc(game["caption"])}</span><em>{esc(ui["open_game"])} ↗</em></a></li>'
            for game in post["game_links"]
        )
        games_html = f'<section class="blog-related-games"><h2>{esc(ui["related_games"])}</h2><ul>{cards}</ul></section>'
    affiliate = ""
    if post["slug"] == "budget-gaming-setup":
        affiliate = f'<aside class="blog-affiliate-note"><strong>{esc(ui["affiliate_title"])}</strong><p>{esc(ui["affiliate_empty"])}</p></aside>'
    others = [item for item in data["posts"] if item["slug"] != post["slug"]]
    related = "".join(article_card(locale, item, games, ui) for item in others)
    related_html = f'<section class="blog-more"><h2>{esc(data["home"]["latest"])}</h2><div class="blog-grid">{related}</div></section>'
    title = esc(post["title"]).replace("\n", "<br>")
    home_href = "/tr/" if locale == "tr" else "/"
    archive_href = public_path(locale, "blog.html")
    return (head(locale, post["meta_title"], post["meta_description"], canonical_path, cover, "article", schema, all_paths)
        + "<body>" + header(locale, data, route) + f'''<main class="blog-main blog-article-page" id="main-content">
<nav class="blog-breadcrumb" aria-label="Breadcrumb"><a href="{esc(home_href)}">{esc(ui['nav_home'])}</a><span aria-hidden="true">/</span><a href="{esc(archive_href)}">{esc(ui['nav_blog'])}</a><span aria-hidden="true">/</span><span aria-current="page">{esc(post['category'])}</span></nav>
<article class="blog-article"><header class="blog-article-header"><span class="blog-category">{esc(post['category'])}</span><h1>{title}</h1><p class="blog-article-excerpt">{esc(post['excerpt'])}</p><div class="blog-article-meta"><span>{esc(ui['published'])}: <time datetime="{esc(post['date_published'])}">{esc(post['date_published'])}</time></span><span>{post['minutes']} {esc(ui['read_time'])}</span></div><img class="blog-article-cover" src="{esc(cover)}" alt="{esc(post['title'])}" fetchpriority="high"></header>
{share_panel(locale, post, ui)}<div class="blog-article-body">{sections}</div>{affiliate}
<section class="blog-faq"><h2>{esc(ui['faq'])}</h2>{faqs}</section>{games_html}</article>
{related_html}
</main>''' + footer(locale, data)
        + f'<script>localStorage.setItem("kitg-language",{json.dumps(locale)});</script><script src="/blog-nav.js" defer></script><script src="/blog-share.js" defer></script></body></html>')


def patch_nav_page(path: Path, locale: str, data: dict[str, Any]) -> None:
    if not path.exists():
        return
    text = path.read_text(encoding="utf-8")
    guide_paths = [public_path(locale, "guides.html")]
    if locale != "en":
        guide_paths.append("/guides.html")
    blog_path = public_path(locale, "blog.html")
    href_options = "(?:" + "|".join(re.escape(item) for item in guide_paths) + ")"
    anchor_pattern = re.compile(r'<a\b(?=[^>]*\bhref=["\']' + href_options + r'["\'])[^>]*>.*?</a>', re.I | re.S)
    blog_anchor = re.compile(r'<a\b[^>]*\bdata-blog-nav\b[^>]*>.*?</a>', re.I | re.S)
    language_menu = re.compile(r'(<div\b(?=[^>]*class=["\'][^"\']*\bguide-language-menu\b[^"\']*["\'])[^>]*>)(.*?)(</div>)', re.I | re.S)
    text = language_menu.sub(lambda match: match.group(1) + blog_anchor.sub("", match.group(2)) + match.group(3), text)
    insert = f'<a href="{esc(blog_path)}" data-blog-nav>{esc(data["ui"]["nav_blog"])}</a>'

    def add_to_region(source: str, region_pattern: re.Pattern[str]) -> tuple[str, bool]:
        match = region_pattern.search(source)
        if not match:
            return source, False
        region = match.group(0)
        if blog_anchor.search(region):
            return source, True
        updated, count = anchor_pattern.subn(lambda item: item.group(0) + insert, region, count=1)
        if count == 0:
            return source, False
        return source[:match.start()] + updated + source[match.end():], True

    nav_pattern = re.compile(r'<nav\b[^>]*>.*?</nav>', re.I | re.S)
    footer_links_pattern = re.compile(r'<div\b(?=[^>]*class=["\'][^"\']*\blegal-links\b[^"\']*["\'])[^>]*>.*?</div>', re.I | re.S)
    text, nav_done = add_to_region(text, nav_pattern)
    text, footer_done = add_to_region(text, footer_links_pattern)
    if not nav_done:
        raise ValueError(f"Could not add Blog to primary navigation in {path}")
    if not footer_done:
        raise ValueError(f"Could not add Blog to footer navigation in {path}")
    if 'src="/blog-nav.js"' not in text:
        if "</body>" not in text:
            raise ValueError(f"Missing </body> in {path}")
        text = text.replace("</body>", '<script src="/blog-nav.js" defer></script>\n</body>')
    path.write_text(text, encoding="utf-8")


def update_sitemap(documents: dict[str, dict[str, Any]]) -> int:
    path = ROOT / "sitemap.xml"
    text = path.read_text(encoding="utf-8")
    ET.fromstring(text)
    groups = [[public_path(locale, "blog.html") for locale in LOCALES]]
    for post in documents["en"]["posts"]:
        groups.append([public_path(locale, f"blog/{post['slug']}.html") for locale in LOCALES])
    all_blog_paths = {item for group in groups for item in group}
    present = set(re.findall(r"<loc>(.*?)</loc>", text))
    additions: list[str] = []
    for group in groups:
        for locale, loc in zip(LOCALES, group):
            full_loc = absolute(loc)
            if full_loc in present:
                continue
            links = "".join(
                f'<xhtml:link rel="alternate" hreflang="{code}" href="{esc(absolute(alt))}" />'
                for code, alt in zip(LOCALES, group)
            )
            links += f'<xhtml:link rel="alternate" hreflang="x-default" href="{esc(absolute(group[0]))}" />'
            additions.append(f"  <url><loc>{esc(full_loc)}</loc>{links}</url>\n")
    if additions:
        if "</urlset>" not in text:
            raise ValueError("Unexpected sitemap structure")
        text = text.replace("</urlset>", "".join(additions) + "</urlset>")
        ET.fromstring(text)
        path.write_text(text, encoding="utf-8")
    return len(additions)


def write_nav_script(documents: dict[str, dict[str, Any]]) -> None:
    labels = {locale: documents[locale]["ui"]["nav_blog"] for locale in LOCALES}
    js = f'''(() => {{
  const labels = {inline_json(labels)};
  const pathFor = lang => (lang === 'en' ? '' : '/' + lang) + '/blog.html';
  const update = () => {{
    const selector = document.getElementById('languageSelect');
    const lang = (selector && selector.value) || document.documentElement.lang || localStorage.getItem('kitg-language') || 'en';
    const code = Object.prototype.hasOwnProperty.call(labels, lang) ? lang : 'en';
    document.querySelectorAll('[data-blog-nav]').forEach(link => {{
      link.href = pathFor(code);
      link.textContent = labels[code];
    }});
  }};
  update();
  document.getElementById('languageSelect')?.addEventListener('change', update);
}})();
'''
    (ROOT / "blog-nav.js").write_text(js, encoding="utf-8")


def update_route_manifest(documents: dict[str, dict[str, Any]]) -> int:
    path = ROOT / "manus-routes.json"
    manifest = json.loads(path.read_text(encoding="utf-8"))
    routes = manifest.setdefault("routes", [])
    existing = {route.get("path") for route in routes}
    additions: list[dict[str, str]] = []
    for locale in LOCALES:
        data = documents[locale]
        archive = public_path(locale, "blog.html")
        if archive not in existing:
            additions.append({"path": archive, "title": data["home"]["meta_title"]})
            existing.add(archive)
        for post in data["posts"]:
            route = public_path(locale, f"blog/{post['slug']}.html")
            if route not in existing:
                additions.append({"path": route, "title": post["meta_title"]})
                existing.add(route)
    if additions:
        routes.extend(additions)
        path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return len(additions)


def main() -> None:
    documents, games = read_content()
    built = 0
    for locale in LOCALES:
        data = documents[locale]
        archive = ROOT / public_path(locale, "blog.html").lstrip("/")
        archive.parent.mkdir(parents=True, exist_ok=True)
        archive.write_text(archive_page(locale, data, games, documents), encoding="utf-8")
        built += 1
        for post in data["posts"]:
            article_file = ROOT / public_path(locale, f"blog/{post['slug']}.html").lstrip("/")
            article_file.parent.mkdir(parents=True, exist_ok=True)
            article_file.write_text(article_page(locale, data, post, games), encoding="utf-8")
            built += 1
    write_nav_script(documents)
    # Surface the editorial section in the two existing home pages and all translated guide pages.
    for locale in LOCALES:
        home_file = ROOT / ("index.html" if locale == "en" else f"{locale}/index.html")
        if locale in ("en", "tr"):
            patch_nav_page(home_file, locale, documents[locale])
        guide_file = ROOT / ("guides.html" if locale == "en" else f"{locale}/guides.html")
        patch_nav_page(guide_file, locale, documents[locale])
    sitemap_additions = update_sitemap(documents)
    manifest_additions = update_route_manifest(documents)
    print(f"Built {built} crawlable pages across {len(LOCALES)} locales; added {sitemap_additions} sitemap URLs and {manifest_additions} route entries.")


if __name__ == "__main__":
    main()
