# PSU Tier Sorter

PSU Tier Sorter is a static web tool for comparing power supplies by price, wattage, region, and tier. It combines current market listings with SPL's PSU tier list so visitors can quickly find reasonable PSU options without manually cross-checking model names and tier ratings.

The project currently includes three browser pages:

- `index.html` - cheapest PSU results by individual tier, with filters for wattage, region, modularity, size, color, and ATX version.
- `budget.html` - highest-wattage clean A, B, and C tier options under a selected budget.
- `tierAccess.html` - searchable tier browser with a tier range selector.

All pages are static HTML/CSS/JavaScript and read from checked-in CSV files.

## Data Sources

The project uses two kinds of data:

- **Tier data**: sourced from SPL's PSU tier list, with permission from SPL to use the data in this project.
- **Market listing data**: captured from PCPartPicker product-list data and stored locally as CSV files.

PCPartPicker data is not fetched by the live website. The site reads the generated `*.psu_stored.csv` files that are committed with the project.

## Included Regions

The current stored datasets include:

- `psu_stored.csv` - United States
- `ca.psu_stored.csv` - Canada
- `au.psu_stored.csv` - Australia
- `de.psu_stored.csv` - Germany
- `nl.psu_stored.csv` - Netherlands
- `uk.psu_stored.csv` - United Kingdom

The website region selector switches between these files.

## How The Matching Works

The Python tooling compares captured PSU listings against the normalized tier-list data. Matching considers:

- model and series names
- wattage
- efficiency rating
- form factor
- modularity
- known edge cases for models with confusing names

The generated output is written to `psu_stored.csv` or a region-prefixed equivalent. Each row includes the located product, matched tier-list model, tier, price, wattage, image URL, modularity, color, ATX version, and optional product link.

## Project Structure

```text
.
|-- index.html                     # Main cheapest-per-tier finder
|-- budget.html                    # Budget-based wattage finder
|-- tierAccess.html                # Searchable tier access page
|-- website/
|   |-- app.css                    # Shared site styling
|   |-- main.js                    # Main finder logic
|   |-- budget.js                  # Budget finder logic
|   `-- search.js                  # Tier accessor logic
|-- pcpp-qapi-capture-extension/   # Optional local capture helper
|-- tierlist_sorter.py             # Matches captured listings to tier data
|-- tierlist_extractor.py          # Extracts normalized tier-list rows
|-- resort.py                      # Small runner for regenerating stored data
|-- spec_tierlist.csv              # Normalized tier-list source data
`-- *.psu_stored.csv               # Website-ready regional output files
```



## Updating Data

The typical update flow is:

1. Capture or update `psus_located.csv` for the desired region.
2. Update `spec_tierlist.csv` when the upstream tier list changes.
3. Run `resort.py` or call `sortRegion()` from `tierlist_sorter.py`.
4. Review the generated `psu_stored.csv` output before publishing.

For regional output, `sortRegion("ca")` reads `ca.psus_located.csv` and writes `ca.psu_stored.csv`. The same pattern applies to other region prefixes.

## Capture Helper

The `pcpp-qapi-capture-extension` folder contains an unpacked browser extension used during data maintenance. It passively captures PCPartPicker QAPI responses that the browser has already loaded. It does not paginate automatically, replay requests, or make extra PCPartPicker requests.

See `pcpp-qapi-capture-extension/README.md` for install and usage details.

## Accuracy Notes

PSU model matching is inherently imperfect. Many product families reuse very similar names across different platforms, revisions, wattages, and regional variants. The matching code is designed to make conservative, explainable guesses, but results should still be treated as a starting point rather than a final purchasing decision.

Before buying a PSU, verify the exact model, wattage, platform, warranty, and retailer listing.

## Planned Improvements

- Add a manually labeled validation set for common and difficult PSU listings.
- Report match accuracy and false-positive cases by tier and region.
- Add confidence scores for matched models.
- Flag ambiguous matches instead of displaying them as fully verified.
- Add unit tests for name normalization, wattage extraction, efficiency parsing, and tier matching.
- Separate data ingestion, matching, validation, and frontend code more cleanly.


## Attribution

Tier ratings are based on SPL's PSU tier list:

https://docs.google.com/spreadsheets/d/1akCHL7Vhzk_EhrpIGkz8zTEvYfLDcaSpZRB6Xt6JWkc/edit

The matching, filtering, regional CSV generation, and static web interface are maintained in this repository.

## License

This repository is distributed under the terms in `LICENSE`.
