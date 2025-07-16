#source venv/bin/activate
import requests
from bs4 import BeautifulSoup
import csv
import re
import sys
from zenrows import ZenRowsClient
from playground import API_KEY



client = ZenRowsClient(API_KEY)
url = "https://pcpartpicker.com/products/power-supply/#X=101,98698&sort=price&xcx=0&e=6,5,4,3,2,1"

params = {
    "js_render": "true",                   # enable JavaScript rendering
    "wait_for": ".td__nameWrapper",        # wait until product names appear
    "wait": "3000"                         # add fixed 3-second wait just in case
}

print("Starting")
print("Started Page 1")

def clean_name(name):
    return re.sub(r"\s*\([^)]*\)\s*$", "", name).strip()
progress = 0
total = 100
bar = '#' * progress + '-' * (total - progress)
sys.stdout.write(f'\rProgress: |{bar}| {progress}/{total}')
sys.stdout.flush()
progress += 1
response = client.get(url, params=params)
soup = BeautifulSoup(response.text, "html.parser")

products = soup.select("tr.tr__product")  # each power supply product row
scraped = [
    {"name": "test", "wattage": 69420, "efficiency": "N", "price": 69.420, "size":"SFX", "image": "https://m.media-amazon.com/images/I/41tTcSFPOyS.jpg", "modularity": "Full", "color": "creamy" }
]

for p in products:

    name = p.select_one(".td__nameWrapper")
    price = p.select_one(".td__price")
    efficiency = p.select_one(".td__spec--2")
    wattage = p.select_one(".td__spec--3")
    modularity = p.select_one(".td__spec--4")
    color = p.select_one(".td__spec--5")

    size = p.select_one(".td__spec--1")
    image = p.find("img")

    #url = p.find("a")

    bar = '#' * progress + '-' * (total - progress)
    sys.stdout.write(f'\rProgress: |{bar}| {progress}/{total}')
    sys.stdout.flush()
    progress += 1
    if name:
        name = clean_name(name.get_text(strip=True))
        if price:
            price = float(price.get_text(strip=True)[1:-3])
        if wattage:
            wattage = int(wattage.get_text(strip=True)[7:-1])
        if efficiency:
            efficiency = (efficiency.get_text(strip=True))
        if size:
            size = size.get_text(strip=True)
        if modularity:
            modularity = modularity.get_text(strip=True)
        if image:
            image = image.get('src')
        if color:
            color = color.get_text(strip=True)
        scraped.append({"name": name, "wattage": wattage, "efficiency": efficiency, "price": price, "size": size, "image":image, "modularity": modularity, "color": color})
        # print("🔌 Name:", name)
        # print("💲 Price: $", price if price else "N/A")
        # print("⚡ Wattage:", wattage, "W" if wattage else "N/A")
        # print("80+ Efficiency:", efficiency if efficiency else "N/A")
        # print("📦:", size if size else "N/A")


        # print("-" * 40)
pageTwo = True
if(pageTwo):
    print()
    print("Started Page 2")
    client1 = ZenRowsClient(API_KEY)
    progress = 0
    total = 100
    bar = '#' * progress + '-' * (total - progress)
    sys.stdout.write(f'\rProgress: |{bar}| {progress}/{total}')
    sys.stdout.flush()
    progress += 1
    params1 = {
    "js_render": "true",                   # enable JavaScript rendering
    "wait_for": ".td__nameWrapper",        # wait until product names appear
    "wait": "2000"                         # add fixed 3-second wait just in case
    }
    url1 = "https://pcpartpicker.com/products/power-supply/#X=101,98698&sort=price&xcx=0&e=6,5,4,3,2,1&page=2"
    response = client1.get(url1, params=params1)
    soup1 = BeautifulSoup(response.text, "html.parser")
    products1 = soup1.select("tr.tr__product")  # each power supply product row
    for p in products1:
        name = p.select_one(".td__nameWrapper")
        price = p.select_one(".td__price")
        efficiency = p.select_one(".td__spec--2")
        wattage = p.select_one(".td__spec--3")
        modularity = p.select_one(".td__spec--4")
        size = p.select_one(".td__spec--1")
        image = p.find("img")
        color = p.select_one(".td__spec--5")

        bar = '#' * progress + '-' * (total - progress)
        sys.stdout.write(f'\rProgress: |{bar}| {progress}/{total}')
        sys.stdout.flush()
        progress += 1
        if name:
            name = clean_name(name.get_text(strip=True))
            if price:
                price = float(price.get_text(strip=True)[1:-3])
            if wattage:
                wattage = int(wattage.get_text(strip=True)[7:-1])
            if efficiency:
                efficiency = (efficiency.get_text(strip=True))
            if size:
                size = size.get_text(strip=True)
            if modularity:
                modularity = modularity.get_text(strip=True)
            if color:
                color = color.get_text(strip=True)
            if image:
                image = image.get('src')
            scraped.append({"name": name, "wattage": wattage, "efficiency": efficiency, "price": price, "size": size, "image":image, "modularity": modularity, "color": color})

print()
print("finished collecting data")
with open("psus_scraped.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=scraped[0].keys())
    writer.writeheader()
    writer.writerows(scraped)
print("Finished writing")