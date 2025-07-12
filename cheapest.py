import csv

images = False
cheapests = []
def find_cheapest_for_price(desired_wattage):
    # Ask user for desired minimum wattage


    # Tier range you're interested in
    target_tiers = ["C-", "C", "C+","B-", "B", "B+","A-", "A", "A+"]

    # Dictionary to hold the cheapest PSU for each tier
    cheapest_by_tier = {}

    with open("psu_stored.csv", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)

        for row in reader:
            tier = row["Tier"].strip()
            price_str = row["Price"].strip()

            if tier not in target_tiers or price_str in ("", "N/A"):
                continue

            try:
                price = float(price_str)
                wattage = int(row["Wattage"].strip())
            except ValueError:
                continue  # Skip if price or wattage is invalid

            if wattage < desired_wattage:
                continue  # Skip PSUs below the desired wattage

            current = cheapest_by_tier.get(tier)
            if current is None or price < current["Price"]:
                cheapest_by_tier[tier] = {
                    "Image": row["Image URL"],
                    "Name": row["Scraped Name"],
                    "Price": price,
                    "Matched Model": row["Matched Tier Model"],
                    "Efficiency": row["Efficiency"],
                    "Wattage": wattage,
                    "Extra Notes/Information": row["Matched Tier Model Info"].replace(",",';'),
                }

    # Print sorted by tier
    tier_order = {t: i for i, t in enumerate(target_tiers)}
    print(f"\n💡 Cheapest PSUs for **{desired_wattage}W and up** in each tier:")
    print(f"\n⚠️  I really am not 100% confident in these results because many PSUs have different, very similar variants ⚠️\n")

    for tier in sorted(cheapest_by_tier, key=lambda t: tier_order[t]):
        psu = {}
        psu["Tier"] = tier
        psu.update(cheapest_by_tier[tier])
        
        cheapests.append(psu)
        print(f"🟩 Tier {tier}: 💰${psu['Price']} — {psu['Name']} ⚡{psu['Wattage']}W 🔌{psu['Efficiency']}. 🧠 We think it is a: ({psu['Matched Model']})", f"⚠️ Extra Notes(of the matched PSU): {psu['Extra Notes/Information']}" if psu['Extra Notes/Information'] else "", f"{psu['image']}" if images else "" )
    with open("cheapest.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=cheapests[0].keys())
        writer.writeheader()
        writer.writerows(cheapests)
alone = True
if alone:
    try:
        w = int(input("🔧 Enter the **minimum** PSU wattage (e.g., 650): ").strip())
        find_cheapest_for_price(w)

    except ValueError:
        print("❌ Invalid wattage. Please enter a number like 650.")
        exit()
