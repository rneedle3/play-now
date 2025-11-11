"""Extract and parse __NEXT_DATA__ from test_page.html"""

import json

with open("test_page.html", "r") as f:
    html = f.read()

# Find __NEXT_DATA__
marker = '<script id="__NEXT_DATA__" type="application/json">'
start = html.index(marker) + len(marker)
end = html.index('</script>', start)
json_str = html[start:end]

# Parse JSON
data = json.loads(json_str)

# Print structure
print("Top-level keys:", list(data.keys()))

if 'props' in data:
    print("props keys:", list(data['props'].keys()))

    if 'pageProps' in data['props']:
        print("pageProps keys:", list(data['props']['pageProps'].keys()))

        # Try to find location data
        page_props = data['props']['pageProps']

        if 'selectedLocation' in page_props:
            loc = page_props['selectedLocation']
            print(f"\n✓ Found selectedLocation:")
            print(f"  ID: {loc.get('id')}")
            print(f"  Name: {loc.get('name')}")

# Save pretty JSON
with open("next_data.json", "w") as f:
    json.dump(data, f, indent=2)

print("\n✓ Saved formatted JSON to next_data.json")
