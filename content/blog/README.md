# King in the Game blog publishing notes

The blog is statically rendered for search engines. `source-en.json` is the English editorial source and `locales/*.json` contains the complete localized versions. Run `python3 scripts/build_blog.py` from the repository root after editing any page copy. The script writes each archive/article page, refreshes the Blog links in the existing home and guide pages, updates `manus-routes.json`, and appends missing localized routes with hreflang alternates to `sitemap.xml`.

## Current editorial set

The launch set has three evergreen articles: choosing a two-player browser game, safe checks when a browser game does not load, and a budget gaming-setup checklist. Each article links to current game pages where relevant. One older game detail page is not translated in every locale; the generator uses that game’s verified English page as a valid fallback rather than creating a broken localized link.

## Affiliate status

There are **no active affiliate product links or product endorsements** in the launch articles. The gear article is a general buying checklist, not a hands-on test. The blog and article contain a clear conditional disclosure explaining that any later partner link will be identified and may earn the site a commission at no additional cost to the reader.

To activate affiliate monetization, first provide the approved affiliate program(s), the exact destination/deep links or tracking URLs, the regions where they are valid, and the products that are genuinely appropriate to recommend. Add each recommendation only after checking the programme’s current rules. Put the disclosure beside the link, use `rel="sponsored nofollow noopener noreferrer"` on affiliate destinations, translate visible product copy for all supported locales, and update this note if the article’s testing status changes. Do not add a generic network search link or claim a product was tested when it was not.

## Measurement

The new share buttons send GA4 `share` events only if a site-wide `gtag` instance is already present. No analytics ID or new tracking property is added by this change. Use Search Console to monitor impressions, queries, clicks, indexing and the sitemap after publication; provide a GA4 measurement ID if share and page events should be wired to an analytics property.
