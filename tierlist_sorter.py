from rapidfuzz import fuzz
import re
import csv
import cheapest

scraped = []
with open("psus_scraped.csv", newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)

    for row in reader:
        scraped.append({
            "name": row["name"].strip(),
            "wattage": int(row["wattage"].strip()),
            "efficiency": row["efficiency"].strip(),
            "price": float(row["price"].strip()),
            "size": row["size"].strip()
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

with open("spec_tierlist732025.csv", "r", newline="", encoding="utf-8") as csvfile:
    csv_reader = csv.reader(csvfile)
    header = next(csv_reader)  # Skip bad header row

    current_brand = ""
    current_series = ""

    for row in csv_reader:
        if len(row) < 12:
            continue

        # Extract fields
        brand = row[0].strip() or current_brand
        series = row[1].strip() or current_series
        series1 = row[2].strip()
        series2 = row[3].strip()
        wattages = row[4].strip()
        tier = row[5].strip()
        efficiency_code = row[12].strip()
        size = row[8].strip()
        year = row[6].strip()

        # Skip incomplete or malformed entries
        if not wattages or not tier or not brand:
            continue

        current_brand = brand
        current_series = series

        # Normalize efficiency rating from code
        efficiency = efficiency_dict.get(efficiency_code, "error")

        # Combine brand + series fields into matchable name
        model = normalize_model_name(brand, series, series1, series2)

        psus_rated.append({
            "brand": brand,
            "model": model,
            "wattages": wattages,
            "tier": tier,
            "efficiency": efficiency,
            "size": size,
            "series2": series2,
            "year": year
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

def match_psu(scraped_psu, psus_rated, threshold=60):
    matches = []
    for entry in psus_rated:
        model_str = normalize_name(entry["model"])
        score = fuzz.token_set_ratio(scraped_psu["normalized"], normalize_name(entry["model"]))
        if score >= threshold: 
            # Optionally filter by wattage
            if wattage_match(scraped_psu["wattage"], entry["wattages"]):
                if(entry["efficiency"] in scraped_psu["efficiency"] and entry["size"] in scraped_psu["size"]):
                    score+=len(normalize_name(entry["model"]))/5-10
                    if(entry["year"] in scraped_psu["name"]):
                        #print(entry["year"] in scraped_psu["name"])
                        score+=20
                    if("original" in entry["model"]):
                        #print(entry["year"] in scraped_psu["name"])
                        score-=20
                    if("swap" in entry["model"]):
                        #print(entry["year"] in scraped_psu["name"])
                        score+=10
                    if(entry["brand"] == "Vetroo"):
                        if(entry["series2"] == "2023 (ATX 3.0)"):
                            continue
                    matches.append((entry["model"], entry["tier"], score))


    # if(scraped_psu["name"] == "Thermaltake Toughpower GX2"):
    #     print(matches)

    return sorted(matches, key=lambda x: -x[2])  # highest score first

for psu in scraped:
    #print(f"🧩 Matching: {psu['name']} ({psu['wattage']}W)")
    results = match_psu(psu, psus_rated)
    #print(f"💲 Price: ${psu['price']}" if psu.get("price") else "💲 Price: N/A")
    best_match = ["No Match", "N/A", "0"]
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
        "Similarity": best_match[2] if best_match else 0
    })
    #print("-" * 50)

with open("psu_stored.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=matched_psus[0].keys())
    writer.writeheader()
    writer.writerows(matched_psus)

cheapest.find_cheapest_for_price(450)