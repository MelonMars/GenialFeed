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
from firebase_admin import firestore
import firebase_admin
from firebase_admin import credentials
from bs4 import BeautifulSoup
import re
from urllib.parse import urljoin

cred = credentials.Certificate("BackendContainer/Backend/linkaggregator-bb44b-firebase-adminsdk-4zwbg-9ce8bd5185.json")
app = firebase_admin.initialize_app(cred)

db = firestore.client(app)

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
secrets = json.load(open(".venv\\secrets.json"))
openaiKey = secrets["openaiKey"]

@app.get("/makeFeed/")
async def apiFeed(feedUrl, userId):
    doc_ref = db.collection("userData").document(userId)
    doc = doc_ref.get()
    try:
        tokens = doc.to_dict()["tokens"]
    except KeyError:
        tokens = 800
        doc_ref.set({"tokens": tokens})

    if tokens < 200:
        return {"response": "TOKENS"}
    tokens -= 250
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
async def get_summary(link: str, userId: str):
    doc_ref = db.collection("userData").document(userId)
    doc = doc_ref.get()
    try:
        tokens = doc.to_dict()["tokens"]
    except KeyError:
        tokens = 800
        doc_ref.set({"tokens": tokens}, merge=True)

    if tokens < 200:
        return {"response": "TOKENS"}
    tokens -= 250
    doc_ref.set({"tokens": tokens}, merge=True)
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


def create_reader_view(html_content, base_url=None):
    soup = BeautifulSoup(html_content, 'html.parser')
    
    for iframe in soup.find_all('iframe'):
        height = iframe.get('height') or iframe.get('style', {}).get('height', '')
        if height and int(height.replace('px', '').strip()) > 0 if height.replace('px', '').strip().isdigit() else False:
            continue
        
        wrapper = soup.new_tag('div')
        wrapper['class'] = 'iframeWrap'
        
        iframe.wrap(wrapper)
    
    for table in soup.select('div.articleBody table'):
        wrapper = soup.new_tag('div')
        wrapper['class'] = 'nnw-overflow'
        table.wrap(wrapper)
    
    for video in soup.find_all('video'):
        video['playsinline'] = True
        if 'nnwAnimatedGIF' not in video.get('class', []):
            video['controls'] = True
            if 'autoplay' in video.attrs:
                del video['autoplay']
    
    for element in soup.select('style, link[rel=stylesheet]'):
        element.decompose()
    
    for element in soup.select('[style]'):
        if 'style' in element.attrs:
            style = element['style']
            for prop in ['color', 'background', 'font', 'max-width', 'max-height', 'position']:
                style = re.sub(f'{prop}[^;]*;', '', style)
                if prop == 'background':
                    style = re.sub(f'background-[^;]*;', '', style)
                elif prop == 'font':
                    style = re.sub(f'font-[^;]*;', '', style)
            
            element['style'] = style
    
    for iframe in soup.find_all('iframe'):
        # Check if iframe is a direct child of body (simplified)
        if iframe.parent.name == 'body':
            height_attr = iframe.get('style', {}).get('height', '')
            if re.search(r'%|vw|vh$', height_attr, re.IGNORECASE):
                if 'class' in iframe.attrs:
                    iframe['class'].append('nnw-constrained')
                else:
                    iframe['class'] = ['nnw-constrained']
    
    for img in soup.find_all('img'):
        if img.has_attr('data-canonical-src'):
            img['src'] = img['data-canonical-src']
        elif base_url and not re.match(r'^[a-z]+://', img.get('src', '')):
            img['src'] = urljoin(base_url, img['src'])
    
    for pre in soup.select('div.articleBody td > pre'):
        for span in pre.find_all('span'):
            span.unwrap()
    
    for elem in soup.select('sup > a[href*="#fn"], sup > div > a[href*="#fn"]'):
        href = elem.get('href', '')
        if href.startswith('#fn') or (base_url and href.startswith(f"{base_url}#fn")):
            if 'class' in elem.attrs:
                elem['class'].append('footnote')
            else:
                elem['class'] = ['footnote']
    
    for img in soup.select('img.wp-smiley[alt]'):
        img.replace_with(img['alt'])
    
    return str(soup)


@app.get("/cleanPage/")
async def cleanPage(link):
    try:
        response = requests.get(link)
        if response.status_code == 200:
            cleaned_html = create_reader_view(response.text, link)
            return {"result": cleaned_html}
        else:
            return "Error fetching page."
    except Exception as e:
        return f"Error: {e}"

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
