import re
import csv

psus_rated = []

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
            modularity = row[11].strip()




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
                "atxver": atxver,
                "modularity": modularity
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
with open("psus_rated.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=psus_rated[0].keys())
        writer.writeheader()
        writer.writerows(psus_rated)