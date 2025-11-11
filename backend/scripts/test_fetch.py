"""Test fetching location data for one court to debug"""

import requests

slug = "alicemarble"
url = f"https://rec.us/{slug}"
headers = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
}

print(f"Fetching {url}...")
response = requests.get(url, headers=headers, timeout=10)
print(f"Status: {response.status_code}")
print(f"Content length: {len(response.text)}")

# Save to file for inspection
with open("test_page.html", "w") as f:
    f.write(response.text)

print("Saved to test_page.html")

# Try to find __NEXT_DATA__
if '<script id="__NEXT_DATA__"' in response.text:
    print("✓ Found __NEXT_DATA__ script")
else:
    print("✗ __NEXT_DATA__ not found")

# Try to find locationId pattern
if 'locationId' in response.text:
    print("✓ Found 'locationId' in page")
    # Find first occurrence
    idx = response.text.index('locationId')
    snippet = response.text[max(0, idx-50):idx+200]
    print(f"Context: ...{snippet}...")
else:
    print("✗ 'locationId' not found in page")
