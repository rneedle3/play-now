"""
Populate Supabase database with scraped court data
Run this after setting up .env with Supabase credentials
"""

from supabase import create_client
from dotenv import load_dotenv
from datetime import datetime
import os
from scraper import scrape_all_locations

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

print("=" * 70)
print("POPULATING SUPABASE DATABASE")
print("=" * 70)
print()

# Create Supabase client
print(f"Connecting to Supabase...")
print(f"URL: {SUPABASE_URL}")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
print("✅ Connected!")
print()

# Scrape all locations
print("Scraping all 27 court locations...")
print("This will take 30-60 seconds...")
print()

locations, slots = scrape_all_locations()

print()
print("=" * 70)
print(f"Scraped {len(locations)} locations with {len(slots):,} available slots!")
print("=" * 70)
print()

# Store locations
print("Storing locations in database...")
try:
    result = supabase.table("locations").upsert(locations).execute()
    print(f"✅ Stored {len(locations)} locations")
except Exception as e:
    print(f"❌ Error storing locations: {e}")
    exit(1)

# Store availability
print("\nStoring availability slots...")
try:
    # Delete old availability (older than today)
    today = datetime.now().strftime("%Y-%m-%d")
    supabase.table("availability").delete().lt("date", today).execute()

    # Insert new slots in batches using upsert to handle duplicates
    chunk_size = 1000
    for i in range(0, len(slots), chunk_size):
        chunk = slots[i:i + chunk_size]
        # Use upsert with on_conflict to handle duplicates based on unique constraint
        supabase.table("availability").upsert(chunk, on_conflict="court_id,slot_datetime").execute()
        print(f"  ✅ Upserted {len(chunk)} slots (batch {i // chunk_size + 1}/{(len(slots) + chunk_size - 1) // chunk_size})")

    print(f"\n✅ Successfully stored {len(slots):,} availability slots!")
except Exception as e:
    print(f"❌ Error storing availability: {e}")
    exit(1)

# Verify
print("\n" + "=" * 70)
print("VERIFICATION")
print("=" * 70)

# Count locations
loc_result = supabase.table("locations").select("*", count="exact").execute()
print(f"✅ Locations in database: {loc_result.count}")

# Count availability
avail_result = supabase.table("availability").select("*", count="exact").execute()
print(f"✅ Availability slots in database: {avail_result.count:,}")

print("\n" + "=" * 70)
print("🎉 DATABASE POPULATED SUCCESSFULLY!")
print("=" * 70)
print("\nYour Supabase database now has:")
print(f"  • {loc_result.count} court locations")
print(f"  • {avail_result.count:,} available time slots")
print("\nNext steps:")
print("  1. Configure Modal: modal secret create ...")
print("  2. Test: modal run modal_service.py")
print("  3. Deploy: modal deploy modal_service.py")
print()
