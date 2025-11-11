"""
Debug script to see what the API actually returns
"""

import json
from scraper import fetch_location_data, LOCATIONS

# Get Alice Marble data
location = LOCATIONS[0]
print(f"Fetching data for: {location['name']}")
print(f"Location ID: {location['location_id']}")
print()

data = fetch_location_data(location['location_id'])

if data:
    # Save raw response
    with open("debug_api_response.json", "w") as f:
        json.dump(data, f, indent=2)

    print("✓ Data fetched successfully")
    print(f"✓ Saved to debug_api_response.json")
    print()

    # Check structure
    if "courts" in data:
        courts = data["courts"]
        print(f"Found {len(courts)} courts")

        for i, court in enumerate(courts[:2], 1):  # Show first 2 courts
            print(f"\nCourt {i}:")
            print(f"  ID: {court.get('id')}")
            print(f"  Number: {court.get('courtNumber')}")

            # Check for availableSlots
            if "availableSlots" in court:
                slots = court["availableSlots"]
                print(f"  Available Slots: {len(slots)}")
                if slots:
                    print(f"  First few slots: {slots[:3]}")
            else:
                print(f"  Available Slots: NOT IN RESPONSE")
                print(f"  Keys in court: {list(court.keys())}")
    else:
        print("❌ No 'courts' key in response")
        print(f"Keys in response: {list(data.keys())}")
else:
    print("❌ Failed to fetch data")
