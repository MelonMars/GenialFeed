import json
import time

import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import feedparser
from urllib.parse import urljoin
from readability import Document
from bs4 import BeautifulSoup as bs
from readability import Document

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/checkFeed/")
async def checkFeed(feedUrl):
    feedResponse = requests.get(feedUrl)
    if feedResponse.status_code != 200:
        return {"response": "BOZO", "message": "Website not reachable"}
    else:
        soup = bs(feedResponse.text, "html.parser")
        links = soup.find_all("link", type="application/rss+xml", rel="alternate")
        if len(links) > 0:
            if links[0].get("href"):
                rssRef = links[0].get("href")
                if not feedparser.parse(rssRef).bozo:
                    return {"response": rssRef}
                elif not feedparser.parse(feedUrl+rssRef).bozo:
                    return {"response": feedUrl+rssRef}
                elif not feedparser.parse(feedUrl + "/" + rssRef).bozo:
                    return {"response": feedUrl + "/" + rssRef}

    if not feedparser.parse(feedUrl).bozo:
        return {"response": feedUrl}
    apaths = ["", "rss.xml", "feed", ".rss", ".feed", "feed.xml", "rss"]
    bpaths = ["", "https://", "http://", "https://www.", "http://www."]
    for path in apaths:
        for bpath in bpaths:
            url = urljoin(str(bpath)+str(feedUrl), str(path))
            print(url)
            feed = feedparser.parse(urljoin(str(bpath)+str(feedUrl), str(path)))
            if not feed.bozo:
                return {"response": urljoin(str(bpath)+str(feedUrl), str(path))}
            time.sleep(1)
    return {"response": "BOZO"}


@app.get("/feed/")
async def read_feed(feed):
    print(feed)
    feed = feedparser.parse(feed)
    if feed.bozo:
        response = requests.get(feed)
        res = ""
        if response.status_code == 200:
            res = response.text
            return read_feed(res)
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
                for entry in feed.entries
            ]
        }
    }


@app.get("/makeFeed/")
async def apiFeed(feedUrl):
    response = requests.get(feedUrl)
    res = ""
    if response.status_code == 200:
        res = response.text
    else:
        return {"response": "ERROR"}

    url = "http://localhost:1234/v1/chat/completions"
    headers = {
        "Content-Type": "application/json"
    }
    data = {
        "messages": [
            {
                "role": "system",
                "content": "You are an AI with the job of making an RSS feed from a site. You will be given some HTML code. If the site can have an RSS feed made from it, then reply with the RSS feed made from the data. Otherwise, reply with 'No'. Do not include extraneous tokens. You should return the RSS feed itself, in RSS XML, not code to create the feed -- no php."
            },
            {
                "role": "user",
                "content": res
            }
        ],
        "temperature": 0.7,
        "max_tokens": 100,
        "stream": True
    }

    response = requests.post(url, headers=headers, data=json.dumps(data), stream=True)

    feed = ""
    if response.status_code == 200:
        response_text = ""
        for chunk in response.iter_content(chunk_size=None):
            response_text += chunk.decode('utf-8')

        for line in response_text.split("\n"):
            try:
                j = json.loads(line[5:])
                feed += j["choices"][0]["delta"]["content"]
            except:
                pass

    feed2 = feedparser.parse(feed)
    if feed2.bozo:
        return {"response": "BOZO"}
    else:
        return {"response": feed}


@app.get("/getSummary/")
async def getSummary(link):
    print("Get Summary")
    res = requests.get(link)
    url = "http://localhost:1234/v1/chat/completions"

    doc = Document(res.text)
    message = doc.summary()

    headers = {
        "Content-Type": "application/json"
    }

    data = {
        "messages": [
            {
                "role": "system",
                "content": "You are an AI with a job to do. You will be provided with the HTML code of a webpage, and it is your job to make a brief summary/TL;DR of the webpage. Do not include TL;DR or extraneous tokens. You should return a summary of the webpage. You have 150 tokens, or 3 sentences."
            },
            {
                "role": "user",
                "content": message
            }
        ],
        "temperature": 0.7,
        "max_tokens": 150,
        "stream": True
    }

    response = requests.post(url, headers=headers, data=json.dumps(data), stream=True)

    summary = ""
    if response.status_code == 200:
        response_text = ""
        for chunk in response.iter_content(chunk_size=None):
            response_text += chunk.decode('utf-8')
        for line in response_text.split("\n"):
            try:
                j = json.loads(line[5:])
                summary += j["choices"][0]["delta"]["content"]
            except:
                pass
    else:
        return {"result": "ERROR"}

    print(summary)
    return {"result": summary}


@app.get("/cleanPage/")
async def cleanPage(link):
    return {"result": Document(requests.get(link).content).summary()}
