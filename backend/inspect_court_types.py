#!/usr/bin/env python3
"""
Inspect court data to find field that indicates tennis vs pickleball
"""
import requests
import json

# Crocker Amazon location ID (has both tennis and pickleball)
location_id = '779905bd-4c2b-45b3-abd0-48140998bca1'
url = f'https://api.rec.us/v1/locations/{location_id}?publishedSites=true'

headers = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Accept": "application/json",
    "Origin": "https://www.rec.us",
    "Referer": "https://www.rec.us/",
}

print("Fetching Crocker Amazon court data...")
response = requests.get(url, headers=headers)
data = response.json()

print("\nFull response:")
print(json.dumps(data, indent=2)[:1000])  # Print first 1000 chars
print("\n...")
print("\nFull response keys:", data.keys())
print("\nLocation keys:", data.get('location', {}).keys() if 'location' in data else "No location key")

courts = data.get('location', {}).get('courts', [])
print(f"\nNumber of courts: {len(courts)}")
print("\n" + "="*70)

for i, court in enumerate(courts, 1):
    print(f"\nCourt {i}:")
    print(f"  Court Number: {court.get('courtNumber')}")
    print(f"  ID: {court.get('id')}")
    print(f"  Name: {court.get('name')}")

    # Print all fields to find the court type indicator
    print(f"\n  All fields:")
    for key, value in court.items():
        if key not in ['availableSlots', 'config']:  # Skip large fields
            print(f"    {key}: {value}")

    # Check config thoroughly
    config = court.get('config', {})
    print(f"\n  Config fields:")
    for key, value in config.items():
        if key == 'pricing':
            print(f"    {key}: (pricing object - skipping details)")
        else:
            print(f"    {key}: {value}")
    
    # Check for sport/court type in various places
    print(f"\n  Checking for sport/court type:")
    print(f"    config.get('sport'): {config.get('sport')}")
    print(f"    config.get('courtType'): {config.get('courtType')}")
    print(f"    config.get('type'): {config.get('type')}")
    print(f"    court.get('sport'): {court.get('sport')}")
    print(f"    court.get('courtType'): {court.get('courtType')}")
    print(f"    court.get('type'): {court.get('type')}")

    print("-" * 70)
