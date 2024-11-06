import requests
from bs4 import BeautifulSoup as bs
import json


def scrape(offset):
    allLinks = {}
    res = requests.get(f"https://news.ycombinator.com/?p={int(offset) + 1}")
    soup = bs(res.text, "html.parser")
    links = {}
    titles = soup.find_all("span", {"class": "titleline"})
    for title in titles:
        link = title.find("a")
        if link:
            links[link.text] = link["href"]

    allLinks.update(links)
    print(json.dumps(allLinks, indent=2))
    return json.dumps(allLinks, indent=2)
