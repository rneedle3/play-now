"""
Helper script to fetch location IDs for all SF RecPark courts
Run this to populate the LOCATIONS list in scraper.py
"""

import requests
import time
import json

# All court slugs from https://sfrecpark.org/1446/Reservable-Tennis-Courts
SLUGS = [
    "alicemarble",
    "balboa",
    "buenavista",
    "crockeramazon",
    "dolores",
    "dupont",
    "fulton",
    "glencanyon",
    "hamilton",
    "jackson",
    "joedimaggio",
    "jpmurphy",
    "lafayette",
    "mclaren",
    "minnielovieward",
    "miraloma",
    "moscone",
    "mountainlake",
    "parkside",
    "potrerohill",
    "presidiowall",
    "richmond",
    "rossi",
    "sterngrove",
    "stmarys",
    "sunset",
    "uppernoe",
]


def fetch_location_id_from_page(slug: str) -> tuple[str, str]:
    """
    Fetch the location ID by scraping the rec.us page HTML
    The location ID is embedded in the Next.js __NEXT_DATA__ JSON
    Then fetch the full location data from the API to get the name
    """
    url = f"https://rec.us/{slug}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    }

    try:
        # Step 1: Get location ID from page
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        html = response.text

        # Extract JSON from __NEXT_DATA__ script tag
        next_data_marker = '<script id="__NEXT_DATA__" type="application/json">'
        if next_data_marker not in html:
            return None, None

        start = html.index(next_data_marker) + len(next_data_marker)
        end = html.index('</script>', start)
        json_str = html[start:end]

        # Parse JSON
        import json as json_lib
        data = json_lib.loads(json_str)

        # Extract location ID from query params
        if 'query' in data and 'locationId' in data['query']:
            location_id = data['query']['locationId']

            # Step 2: Fetch location data from API to get name
            api_url = f"https://api.rec.us/v1/locations/{location_id}"
            api_headers = {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
                "Accept": "application/json",
                "Origin": "https://www.rec.us",
                "Referer": "https://www.rec.us/",
            }

            api_response = requests.get(
                api_url,
                params={"publishedSites": "true"},
                headers=api_headers,
                timeout=10
            )

            if api_response.status_code == 200:
                location_data = api_response.json()
                if 'location' in location_data:
                    location_name = location_data['location'].get('name')
                    return location_id, location_name

        return None, None

    except Exception as e:
        print(f"({e})")
        return None, None


def main():
    locations = []

    print("Fetching location IDs for all courts...")
    print("This may take a minute...\n")

    for slug in SLUGS:
        print(f"Fetching {slug}...", end=" ")
        location_id, name = fetch_location_id_from_page(slug)

        if location_id:
            locations.append({
                "name": name,
                "slug": slug,
                "location_id": location_id
            })
            print(f"✓ {name}")
        else:
            print(f"✗ Failed")

        # Be nice to the API
        time.sleep(0.5)

    print(f"\n{'='*60}")
    print(f"Found {len(locations)} locations!")
    print(f"{'='*60}\n")

    # Generate Python code for the LOCATIONS list
    print("# Copy this into your scraper.py file:\n")
    print("LOCATIONS = [")
    for loc in locations:
        print(f'    {{"name": "{loc["name"]}", "slug": "{loc["slug"]}", "location_id": "{loc["location_id"]}"}},')
    print("]\n")

    # Save to a JSON file
    with open("locations.json", "w") as f:
        json.dump(locations, f, indent=2)
    print("✓ Saved to locations.json")


if __name__ == "__main__":
    main()
