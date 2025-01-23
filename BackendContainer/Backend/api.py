import json
import time

import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import feedparser

import validators
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup as bs
from readability import Document
import httpx

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=["*"],
    allow_headers=["*"],
)


def check_common_child_paths(feed_url):
    """Check common paths under the URL for potential RSS feeds."""
    common_paths = ["rss.xml", "feed", "feeds", "rss", "feed.xml"]
    for path in common_paths:
        url = urljoin(feed_url, path)
        print(f"Checking child path: {url}")

        feed = feedparser.parse(url)
        if not feed.bozo:
            return url
    return None


def find_rss_link_in_soup(soup, base_url):
    """Look for RSS link in the soup and return absolute URL if found."""
    links = soup.find_all("link", type="application/rss+xml", rel="alternate")
    for link in links:
        href = link.get("href")
        if href:
            rss_url = urljoin(base_url, href)
            if not feedparser.parse(rss_url).bozo:
                return rss_url
    return None


def check_parent_pages(feed_url):
    """Check parent pages up the URL hierarchy for RSS feed links."""
    parsed_url = urlparse(feed_url)
    path_segments = parsed_url.path.strip("/").split("/")

    for i in range(len(path_segments), 0, -1):
        parent_url = parsed_url._replace(path="/".join(path_segments[:i]) + "/").geturl()
        print(f"Checking parent page: {parent_url}")

        response = requests.get(parent_url)
        if response.status_code == 200:
            soup = bs(response.text, "html.parser")
            rss_url = find_rss_link_in_soup(soup, parent_url)
            if rss_url:
                return rss_url
    return None


@app.get("/checkFeed/")
async def checkFeed(feedUrl: str):
    if not validators.url(feedUrl):
        feedUrl = "https://" + feedUrl

    try:
        feedResponse = requests.get(feedUrl)
    except requests.RequestException:
        return {"response": "BOZO", "message": "Website not reachable"}

    if feedResponse.status_code != 200:
        return {"response": "BOZO", "message": "Website not reachable"}

    soup = bs(feedResponse.text, "html.parser")

    rss_url = find_rss_link_in_soup(soup, feedUrl)
    if rss_url:
        return {"response": rss_url}

    if not feedparser.parse(feedUrl).bozo:
        return {"response": feedUrl}

    rss_url = check_parent_pages(feedUrl)
    if rss_url:
        return {"response": rss_url}

    rss_url = check_common_child_paths(feedUrl)
    if rss_url:
        return {"response": rss_url}

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

openaiModel = "gpt-4o-mini"
openaiKey = "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"

@app.get("/makeFeed/")
async def apiFeed(feedUrl):
    response = requests.get(feedUrl)
    res = ""
    if response.status_code == 200:
        res = response.text
    else:
        return {"response": "ERROR"}

    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "GenialFisher",
	"Authorization": f"Bearer {openaiKey}"
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
        "stream": True,
	"model": openaiModel,
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
async def get_summary(link: str):
    print("Get Summary")

    async with httpx.AsyncClient() as client:
        res = await client.get(link)
        if res.status_code != 200:
            return {"result": "ERROR fetching link"}

    doc = Document(res.text)
    message = doc.summary()

    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {openaiKey}"}
    data = {
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are an AI with a job to do. You will be provided with the HTML code of a webpage, "
                    "and it is your job to make a brief summary/TL;DR of the webpage. Do not include TL;DR or "
                    "extraneous tokens. You should return a summary of the webpage. You have 150 tokens, or 3 sentences."
                )
            },
            {
                "role": "user",
                "content": message[:4500]
            }
        ],
        "temperature": 0.7,
        "stream": False,
        "max_tokens": 1000,
	"model": openaiModel,
    }

    url = "https://api.openai.com/v1/chat/completions"
    response = requests.post(url, headers=headers, json=data, verify=False, stream=False)
    try:
        summary = response.json()['choices'][0]['message']['content']
    except:
        print("ERROR Generating Summary!! OpenAI output is: " + response.text)
    print(summary)
    return {"result": summary}



@app.get("/cleanPage/")
async def cleanPage(link):
    return {"result": Document(requests.get(link).content).summary()}

@app.get("/getFavicon/")
async def getFavicon(url):
    try:
        parsed_url = urlparse(url)
        base_url = f"{parsed_url.scheme}://{parsed_url.netloc}"
        print("Scheme:", parsed_url.scheme, "Netloc:", parsed_url.netloc, "Base URL:", base_url)
        favicon_url = f"{base_url}/favicon.ico"
        response = requests.get(favicon_url)
        if response.status_code == 200:
            return {"favicon_url": favicon_url}
        else:
            return "Favicon not found at the usual location."
    except Exception as e:
        return f"Error: {e}"

@app.get("/")
async def read_root():
    return {"status": "ok"}

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
