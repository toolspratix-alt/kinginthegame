# Platform readiness

King in the Game is a static, provider-neutral HTML5 game portal. Current `games.json` entries use authorized GameMonetize-hosted embeds. The site can be adapted to another provider only after that provider approves the domain and supplies the correct embed/API/SDK values.

## Ready at site level

- Live, responsive browser-game portal with category and search navigation.
- A separate play route for every catalog item.
- Provider/source link on each game page.
- Privacy, Terms and Contact/removal pages.
- Sitemap, robots, 404 page and route manifest.
- No download buttons, copied game files, third-party ad tags or analytics scripts in the portal shell.
- No account, payment or personal-data collection in the portal shell.
- Game metadata is centralized in `games.json` so a provider migration does not require rebuilding the UI.

## Platform-specific onboarding still required

### GamePix

Use the Publisher/Affiliate program for catalog games. Obtain approval, then replace the relevant `embed`/API values in `games.json`. Follow GamePix’s SDK and submission rules; do not add independent ads, analytics or copied game files if their current guidelines prohibit them. Payment method and threshold must be confirmed in the dashboard because the public publisher page does not specify them.

### Playgama

Apply as a Partner for widget/API/link distribution. After approval, add the supplied widget/API identifiers and domain settings. Confirm the written revenue-share rate before publishing: the public FAQ and current Partner Terms have different figures. Confirm the USD payment method, 100 USD request threshold and tax/KYC requirements in the dashboard.

### Gamezop

Apply through Business Alliances as a publisher. After onboarding, use the assigned Unique Link, API or SDK rather than copying games. Confirm the commercial share, invoice flow, payment threshold, payout timing and Turkey availability in writing before launch.

### CrazyGames and Poki

These are primarily developer submission and curation programs, not general catalog networks for a publisher’s own site. Submit an owned/licensed game through their developer process only when you control the required rights and can use their SDK. Do not represent the King in the Game catalog as a CrazyGames or Poki partnership without written approval.

## Required before enabling any provider

1. Add the live domain in the provider dashboard.
2. Add the exact provider-supplied `ads.txt` lines to `/ads.txt` when requested. Never invent publisher IDs.
3. Keep written evidence of commercial web publishing, advertising monetization and third-party distribution rights for every title.
4. Check the provider’s current content, privacy, SDK, advertising and payment rules.
5. Test mobile, desktop, iframe permissions, fullscreen and ad behavior after activation.
6. Remove a title immediately when the provider or rights holder revokes access.
