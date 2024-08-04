from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import feedparser
from urllib.parse import urljoin

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/checkFeed/")
async def checkFeed(feedUrl):
    print(feedUrl)
    paths = ["rss.xml", "feed", ".rss", ".feed", "feed.xml", "rss"]
    for path in paths:
        feed = feedparser.parse(urljoin(str(feedUrl), str(path)))

        if not feed.bozo:
            return {"response": urljoin(str(feedUrl), str(path))}

    feed = feedparser.parse(feedUrl)
    if not feed.bozo:
        return {"response": feedUrl}

    return {"response": "BOZO"}


@app.get("/feed/")
async def read_feed(feed, page):
    print(feed)
    feed = feedparser.parse(feed)
    if feed.bozo:
        return {"response": "FEEDBROKE"}
    print(feed)
    return {
        "response": {
            "feedInfo": {
                "title": feed.feed.get("title"),
                "link": feed.feed.get("link"),
                "description": feed.feed.get("description"),
                "published": feed.feed.get("published"),
            },
            "entries": [
                {
                    "title": entry.get("title"),
                    "link": entry.get("link"),
                    "description": entry.get("description"),
                    "published": entry.get("published"),
                }
                for entry in feed.entries[((int(page)-1)*10):(int(page)*10)]
            ]
        }
    }