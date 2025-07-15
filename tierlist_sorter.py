from rapidfuzz import fuzz
import re
import csv

scraped = []
with open("psus_scraped.csv", newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)

    for row in reader:
        scraped.append({
            "name": row["name"].strip(),
            "wattage": int(row["wattage"].strip()),
            "efficiency": row["efficiency"].strip().replace("Efficiency Rating", ""),
            "price": float(row["price"].strip()),
            "size": row["size"].strip(),
            "image": row["image"].strip(),
            "modularity": row["modularity"].strip().replace("Modular", "")
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
            "info": info
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

for item in scraped:
    item["normalized"] = normalize_name(item["name"])



def wattage_match(scraped_watt, tier_wattage_string, tolerance=50):
    # Normalize to ASCII hyphen
    wattage_str = tier_wattage_string.replace("–", "-")

    # Handle ranges like 600-1000W
    range_match = re.match(r".*?(\d{3,4})\s*-\s*(\d{3,4})", wattage_str)
    if range_match:
        low = int(range_match.group(1))
        high = int(range_match.group(2))
        return low - tolerance <= scraped_watt <= high + tolerance

    # Handle sets like 600/700/800W
    watts = [int(w) for w in re.findall(r"\d{3,4}", wattage_str)]
    return any(abs(scraped_watt - w) <= tolerance for w in watts)


matched_psus = []
affiliate_links = {
        "Montech APX": {
            850: "",
            800: "",
            750: "",
            700: "",            
            650: "https://amzn.to/44uiYX3",
            600: "",
            550: "https://amzn.to/46IWt22",
        },
        "Apevia Prestige": {
            850: "",
            800: "",
            750: "",
            700: "",
            600: "https://amzn.to/452Enqv",
        },
        "Montech CENTURY II": {
            1200: "https://amzn.to/4kAqt3D", 
            1050: "https://amzn.to/40jkc4X", 
            850: "https://amzn.to/46bIjGE",
        }
     }
    
def match_psu(scraped_psu, psus_rated, threshold=60):
    matches = []
    for entry in psus_rated:
        model_str = normalize_name(entry["model"])
        score = fuzz.token_set_ratio(scraped_psu["normalized"], normalize_name(entry["model"]))
        if score >= threshold: 
            # Optionally filter by wattage
            if wattage_match(scraped_psu["wattage"], entry["wattages"]):
                if(entry["efficiency"] in scraped_psu["efficiency"] and entry["size"] in scraped_psu["size"]):
                    score+=len(normalize_name(entry["model"]))/5-4
                    if(entry["year"] in scraped_psu["name"]):
                        score+=20
                    if("original" in entry["model"]):
                        score-=20
                    if("swap" in entry["model"]):
                        score+=10
                    if(normalize_name(entry["series1"]) in scraped_psu["normalized"]):
                        score+=10
                    if entry["series2"] == "II VE":
                        score-=0.8
                    if(entry["brand"] == "Vetroo"):
                        if(entry["series2"] == "2023 (ATX 3.0)"):
                            continue
                    if(psu["name"] == "Silverstone ST85F-GS-V2" and model_str == "silverstone triton rx"):
                        score -=0.3
                    matches.append((entry["model"], entry["tier"], score, entry["info"]))


    # if(scraped_psu["name"] == "Thermaltake Toughpower GX2"):
    #     print(matches)

    return sorted(matches, key=lambda x: -x[2])  # highest score first

for psu in scraped:
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
        "Scraped Name": psu["name"],
        "Wattage": psu["wattage"],
        "Price": psu["price"],
        "Efficiency": psu["efficiency"],
        "Matched Tier Model": best_match[0] if best_match else "No Match",
        "Tier": best_match[1] if best_match else "N/A",
        "Matched Tier Model Info": best_match[3] if len(best_match)>2 else "No Match Info",
        "Similarity": best_match[2] if best_match else 0,
        "Image URL": psu["image"],
        "modularity": psu["modularity"],
        "Product URL": (affiliate_links[psu["name"]])[psu["wattage"]] if psu["name"] in affiliate_links else ""
    })
    #print("-" * 50)

with open("psu_stored.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=matched_psus[0].keys())
    writer.writeheader()
    writer.writerows(matched_psus)

