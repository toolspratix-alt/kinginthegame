#!/usr/bin/env python3
"""Generate the Pinterest-compatible RSS feed from games.json."""
from __future__ import annotations

import html
import json
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import format_datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://www.kinginthegame.com"
CATALOG = ROOT / "games.json"
OUTPUT = ROOT / "pinterest-feed.xml"


def esc(value: object) -> str:
    return html.escape(str(value), quote=True)


def existing_dates() -> dict[str, str]:
    """Keep existing dates stable so Pinterest does not see old games as new."""
    if not OUTPUT.exists():
        return {}
    try:
        root = ET.parse(OUTPUT).getroot()
        return {
            item.findtext("guid", ""): item.findtext("pubDate", "")
            for item in root.findall("./channel/item")
            if item.findtext("guid") and item.findtext("pubDate")
        }
    except ET.ParseError:
        return {}


def main() -> None:
    games = json.loads(CATALOG.read_text(encoding="utf-8"))
    dates = existing_dates()
    now_rfc822 = format_datetime(datetime.now(timezone.utc), usegmt=True)
    items: list[str] = []

    for game in games:
        game_id = game["id"]
        title = game["title"]
        genre = game.get("genre", "Browser Games")
        label = game.get("label", "Play online")
        url = f"{BASE}/games/{game_id}.html"
        image = game.get("cover", "")
        if image.startswith("/"):
            image = BASE + image
        description = game.get("editorial") or f"{genre} · {label}."
        description = f"Play {title} online. {description} No download required."
        pub_date = dates.get(url, now_rfc822)
        items.append(
            "\n".join(
                [
                    "    <item>",
                    f"      <title>{esc(title)} - Play Online</title>",
                    f"      <link>{esc(url)}</link>",
                    f"      <guid isPermaLink=\"true\">{esc(url)}</guid>",
                    f"      <description>{esc(description)}</description>",
                    f"      <category>{esc(genre)}</category>",
                    f"      <pubDate>{esc(pub_date)}</pubDate>",
                    f"      <enclosure url=\"{esc(image)}\" type=\"image/webp\" />",
                    f"      <media:content url=\"{esc(image)}\" medium=\"image\" type=\"image/webp\" />",
                    f"      <media:title type=\"html\">{esc(title)} - {esc(genre)}</media:title>",
                    f"      <media:description type=\"html\">{esc(description)}</media:description>",
                    "    </item>",
                ]
            )
        )

    feed = "\n".join(
        [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/" xmlns:atom="http://www.w3.org/2005/Atom">',
            "  <channel>",
            "    <title>King in the Game - Curated Browser Games</title>",
            f"    <link>{BASE}/</link>",
            "    <description>Curated browser games across multiplayer PvP, mini strategy, racing and sports.</description>",
            "    <language>en-us</language>",
            f"    <lastBuildDate>{now_rfc822}</lastBuildDate>",
            f"    <atom:link href=\"{BASE}/pinterest-feed.xml\" rel=\"self\" type=\"application/rss+xml\" />",
            *items,
            "  </channel>",
            "</rss>",
            "",
        ]
    )
    OUTPUT.write_text(feed, encoding="utf-8")
    print(f"Generated {OUTPUT} with {len(games)} games")


if __name__ == "__main__":
    main()
