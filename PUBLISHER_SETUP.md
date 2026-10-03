# GameMonetize publisher setup

The site is prepared for GameMonetize-hosted embeds. The remaining account-side steps cannot be completed from the repository:

1. Create/confirm the GameMonetize publisher account.
2. Add `kinginthegame.com` (and the `www` variant if used) in the publisher dashboard.
3. Copy the exact `ads.txt` line(s) supplied by GameMonetize into the repository root as `/ads.txt`. Do not invent a publisher ID or copy another site's line.
4. Confirm the site is live, has enough original content, and passes the provider's advertising/publisher review.
5. Verify each game embed and remove titles for which you do not have platform authorization.
6. Confirm the payout method, threshold, tax/KYC details and Turkey availability in the dashboard.

## What is already in the repository

- GameMonetize-hosted game URLs are stored in `games.json`.
- Game pages expose a source/platform listing link.
- Privacy, terms and contact/removal pages are available.
- `robots.txt`, `sitemap.xml` and `manus-routes.json` are present.

## Important licensing note

A GameMonetize catalog embed is not the same as owning or redistributing the game. Do not download or re-upload games unless the rights holder gives a written commercial web distribution and advertising-monetization license.
