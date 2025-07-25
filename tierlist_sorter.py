from rapidfuzz import fuzz
import re
import csv
from urllib.parse import urlparse, urlunparse, parse_qs, urlencode
region = input("Enter region, enter nothing for USA\n")
if(region != ""):
    region+="."

located = []
with open(region+"psus_located.csv", newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)

    for row in reader:
        located.append({
            "name": row["name"].strip(),
            "wattage": int(row["wattage"].strip()),
            "efficiency": row["efficiency"].strip().replace("Efficiency Rating", ""),
            "price": float(row["price"].strip()),
            "size": row["size"].strip().replace("Type", ""),
            "image": row["image"].strip(),
            "modularity": row["modularity"].strip().replace("Modular", ""),
            "color": row["color"].strip().replace("Color", "")
            })


psus_rated = []

# Your efficiency rating dictionary
efficiency_dict = {
    "W": "80+",
    "B": "80+ Bronze",
    "S": "80+ Silver",
    "G": "80+ Gold",
    "P": "80+ Platinum",
    "T": "80+ Titanium",
    "N": "Dogshit",
    "": "error"
}

def normalize_model_name(*args):
    # Join non-empty components, clean, normalize
    combined = " ".join(arg for arg in args if arg).lower()
    combined = re.sub(r"[^a-z0-9]+", " ", combined)  # keep only alphanumerics
    return combined.strip()

with open("spec_tierlist.csv", "r", newline="", encoding="utf-8") as csvfile:
    csv_reader = csv.reader(csvfile)
    header = next(csv_reader)  # Skip bad header row

    current_brand = ""
    current_series = ""
    current_series1 = ""
    current_series2 = ""


    for row in csv_reader:
        if len(row) < 12:
            continue

        # Extract fields
        brand = row[0].strip()
        series = row[1].strip()
        series1 = row[2].strip()
        series2 = row[3].strip()
        wattages = row[4].strip()
        tier = row[5].strip()
        efficiency_code = row[12].strip()
        size = row[8].strip()
        year = row[6].strip()
        info = row[18].strip()
        atxver = row[9].strip()



        # Skip incomplete or malformed entries
        if not wattages or not tier or (not brand and not current_brand):
            continue


        if(brand != ""):
            current_brand = brand
        if(series != ""):
            current_series = series
            current_series1= ""
            current_series2= ""
        if(series1 != ""):
            current_series1 = series1
            current_series2= ""
        if(series2 != ""):
            current_series2 = series2
        


        # Normalize efficiency rating from code
        efficiency = efficiency_dict.get(efficiency_code, "error")

        # Combine brand + series fields into matchable name
        model = normalize_model_name(current_brand, current_series, current_series1, current_series2)
        psus_rated.append({
            "brand": current_brand,
            "model": model,
            "wattages": wattages,
            "tier": tier,
            "efficiency": efficiency,
            "size": size,
            "series": current_series,
            "series1": current_series1,
            "series2": current_series2,
            "year": year,
            "info": info,
            "atxver": atxver 
        })

def normalize_name(name):
    name = name.lower()
    name = re.sub(r"\(.*?\)", "", name)  # Remove anything in parentheses
    name = re.sub(r"\b\d{3,4}\b", "", name)  # Remove wattages like 750w
    name = re.sub(r"\b\d{3,3}v\b", "", name)  # Remove Voltages like 230V
    name = re.sub(r"[^a-z0-9]+", " ", name)  # Remove symbols, collapse spaces
    name = re.sub(r"gold", " ", name)  # Remove the gold efficiency cuz we already know it :|

    name = re.sub(r"50315153244479", " ", name)# Screw vetroooooooooooooo
    name = re.sub(r"50315153277247", " ", name)# Screw vetroooooooooooooo
    return name.strip()

for item in located:
    item["normalized"] = normalize_name(item["name"])



def wattage_match(located_watt, tier_wattage_string, tolerance=50):
    # Normalize to ASCII hyphen
    wattage_str = tier_wattage_string.replace("–", "-")

    # Handle ranges like 600-1000W
    range_match = re.match(r".*?(\d{3,4})\s*-\s*(\d{3,4})", wattage_str)
    if range_match:
        low = int(range_match.group(1))
        high = int(range_match.group(2))
        return low - tolerance <= located_watt <= high + tolerance

    # Handle sets like 600/700/800W
    watts = [int(w) for w in re.findall(r"\d{3,4}", wattage_str)]
    return any(abs(located_watt - w) <= tolerance for w in watts)


matched_psus = []
affiliate_links = {
     }
def clean_newegg_affiliate_links(text):
    pattern = re.compile(r'https?://(?:www\.)?newegg\.com/[^ ]*?/p/([A-Z0-9\-]+)', re.IGNORECASE)

    def replacer(match):
        product_id = match.group(1)
        clean_link = (
            f"https://www.newegg.com/p/{product_id}"
            f"?ranMID=44583"
            f"&ranEAID=3667186"
            f"&ranSiteID=ECUJk1uD7V8-0BE80SJVi_.Nk3SX_KOP6w"
            f"&ASUBID=Cheesefinder"
        )
        return clean_link
    return pattern.sub(replacer, text)
def clean_amazon_link(url):
    parsed = urlparse(url)

 
    clean_query = {"tag": "psutierlist01-20"}

    clean_url = urlunparse((
        parsed.scheme,
        parsed.netloc,
        parsed.path,
        '',
        urlencode(clean_query),
        ''
    ))

    return clean_url

def addAffiliate(name, wattages, links):
    affiliate_links[name] = {
    }
    for i in range(200,2100,50):
        affiliate_links[name][i] = ""
    if(region == ""):
        for w in range(len(wattages)):
            if "newegg" in links[w]:
                links[w] = clean_newegg_affiliate_links(links[w])
                #print(links[w])
            elif "amazon" in links[w]:
                links[w] = clean_amazon_link(links[w])
            affiliate_links[name][wattages[w]] = links[w]
#?tag=psutierlist01-20
addAffiliate("ASRock Phantom Gaming PG-750G",[750],["https://amzn.to/45hVC7K"])
addAffiliate("ASRock Phantom Gaming PG-850G",[850],["https://amzn.to/4kpwDDI"])
addAffiliate("ASRock Phantom Gaming PG-1000G",[1000],["https://amzn.to/43njvIn"])
addAffiliate("Apevia Prestige",[600,800],["https://amzn.to/42LWXCJ","https://amzn.to/3QxDWwB"])
addAffiliate("Montech APX",[550,650,750],["https://amzn.to/4nDKJE0","https://amzn.to/4lGy6pZ","https://amzn.to/44DJmNa"])
addAffiliate("Montech CENTURY II",[850,1050,1200],["https://amzn.to/4kthp0f","https://amzn.to/460hlS7","https://amzn.to/44k5kpr"])
addAffiliate("Corsair CX650M (2021)",[650],["https://amzn.to/40PDVst"])
addAffiliate("Corsair CX750M (2021)",[750],["https://amzn.to/40RC0nd"])
addAffiliate("NZXT C850 (2024)",[850],["https://amzn.to/4hoJLrR"])
addAffiliate("Vetroo 50315153244479",[850],["https://www.amazon.com/Vetroo-Modular-Operation-10-Year-Warranty/dp/B0DP2KLT8P"])
addAffiliate("Vetroo 50315153277247",[850],["https://www.amazon.com/Vetroo-Modular-Operation-10-Year-Warranty/dp/B0DP2LBPPY"])
addAffiliate("Vetroo GV1000",[1000],["https://www.amazon.com/Vetroo-Modular-Operation-10-Year-Warranty/dp/B0BRN2YG7F"])
addAffiliate("EVGA 850 GQ",[850],["https://www.newegg.com/w/p/N82E16817438061"])
addAffiliate("SeaSonic CORE GX ATX 3 (2024)", [650,850],["https://www.newegg.com/w/p/N82E16817151276","https://www.newegg.com/w/p/N82E16817151278"])
addAffiliate("SAMA GT",[650],["https://amzn.to/3CPjOm9"])
addAffiliate("MSI MPG A850GS PCIE5",[850],["https://amzn.to/4hvgKea"])
addAffiliate("ADATA XPG CYBERCORE",[1000],["https://www.walmart.com/ip/XPG-CYBERCORE-ATX-Modular-PSU-1000W-80-Plus-Platinum-26-Connectors-Intex-ATX-12V/724286138"])
addAffiliate("Silverstone Essential",[550, 750],["https://amzn.to/4aW68Cl", "https://amzn.to/3EtFRzc"])
addAffiliate("Lian Li SP750",[750],["https://amzn.to/3WVfuc5"])
addAffiliate("Cooler Master MWE Gold 850 - V2", [850], ["https://www.amazon.com/dp/B08M9M6DB9"])
addAffiliate("be quiet! Pure Power 12 M", [750,1200],["https://amzn.to/42Ft9r6","https://amzn.to/40XuKHM"])
def match_psu(located_psu, psus_rated, threshold=60):
    matches = []
    for entry in psus_rated:
        model_str = normalize_name(entry["model"])
        score = fuzz.token_set_ratio(located_psu["normalized"], normalize_name(entry["model"]))
        if score >= threshold: 
            # Optionally filter by wattage
            if wattage_match(located_psu["wattage"], entry["wattages"]):
                if(entry["efficiency"] in located_psu["efficiency"] and entry["size"] in located_psu["size"]):
                    score+=len(normalize_name(entry["model"]))/5-4
                    if(entry["year"] in located_psu["name"]):
                        score+=20
                    if("original" in entry["model"]):
                        score-=20
                    if("swap" in entry["model"]):
                        score+=10
                    if(normalize_name(entry["series1"]) in located_psu["normalized"]):
                        score+=10
                    if entry["series2"] == "II VE" and not ("ve" in model_str):
                        score-=0.8
                    if(entry["brand"] == "Vetroo"):
                        if(entry["series2"] == "2023 (ATX 3.0)"):
                            continue
                    if(located_psu["name"] =="Thermaltake Toughpower GF A3 - TT Premium Edition" and "gf a3 n amer" in model_str):
                        score+=20
                    if(psu["name"] == "Silverstone ST85F-GS-V2" and model_str == "silverstone triton rx"):
                        score -=0.3
                    matches.append((entry["model"], entry["tier"], score,entry["atxver"],entry["info"]))


    # if(located_psu["name"] == "Thermaltake Toughpower GX2"):
    #     print(matches)

    return sorted(matches, key=lambda x: -x[2])  # highest score first

for psu in located:
    #print(f"🧩 Matching: {psu['name']} ({psu['wattage']}W)")
    results = match_psu(psu, psus_rated)
    #print(f"💲 Price: ${psu['price']}" if psu.get("price") else "💲 Price: N/A")
    best_match = ["No Match", "N/A", "0", "N/A"]
    if results:
        best_match = results[0]
        #print(f"✅ Best match: {best_match[0]} | Tier: {best_match[1]} | Similarity: {best_match[2]}")
        
    #else:
        #print("❌ No confident match found.")
    
    matched_psus.append({
        "located Name": psu["name"],
        "Wattage": psu["wattage"],
        "Price": psu["price"],
        "Efficiency": psu["efficiency"],
        "Matched Tier Model": best_match[0] if best_match else "No Match",
        "Tier": best_match[1] if best_match else "N/A",
        "Matched Tier Model Info": best_match[4] if len(best_match)>4 else "No Match Info",
        "Similarity": best_match[2] if best_match else 0,
        "Image URL": psu["image"],
        "modularity": psu["modularity"],
        "Product URL": (affiliate_links[psu["name"]])[psu["wattage"]] if psu["name"] in affiliate_links else "",
        "size": psu["size"],
        "color": psu["color"],
        "atxver": best_match[3] if len(best_match)>2 else "ATX 6.9",


    })
    #print("-" * 50)
with open(region+"psu_stored.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=matched_psus[0].keys())
    writer.writeheader()
    writer.writerows(matched_psus)

