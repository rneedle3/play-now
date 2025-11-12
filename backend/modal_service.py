"""
Modal service for SF RecPark Court Scraper
Handles deployment, scheduling, and Supabase integration
"""

import modal
import os
from datetime import datetime
from pathlib import Path

# Create Modal app
app = modal.App("sf-court-scraper")

# Define Modal image with required dependencies
# Get the directory containing this file (backend/)
backend_dir = Path(__file__).parent

image = (
    modal.Image.debian_slim()
    .pip_install(
        "requests",
        "supabase",
    )
    # Copy scraper.py so it can be imported
    .add_local_file(backend_dir / "scraper.py", remote_path="/root/scraper.py")
)

# Supabase configuration (using custom-secret that contains all secrets)
CUSTOM_SECRET = modal.Secret.from_name("custom-secret")


@app.function(
    image=image,
    secrets=[CUSTOM_SECRET],
    timeout=300,
)
def scrape_and_store():
    """
    Main function to scrape court availability and store in Supabase
    Runs on Modal infrastructure
    """
    import sys
    sys.path.insert(0, "/root")
    
    from scraper import scrape_all_locations
    from supabase import create_client, Client

    # Initialize Supabase client
    supabase_url = os.environ["SUPABASE_URL"]
    supabase_key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    supabase: Client = create_client(supabase_url, supabase_key)

    print(f"Starting scrape at {datetime.now()}")

    # Scrape all locations using the scraper module
    locations, slots = scrape_all_locations()

    # Store in Supabase
    try:
        # Store locations (upsert to update if exists)
        if locations:
            result = supabase.table("locations").upsert(locations).execute()
            print(f"Successfully stored {len(locations)} locations")

        # Replace all availability data with latest scrape
        # Strategy: Delete all old data, then insert new data
        # This ensures we only show data from the latest scrape
        if slots:
            print(f"Replacing all availability data with {len(slots)} slots from latest scrape...")
            
            # Step 1: Delete all existing availability data
            # We only do this if we have new data to insert (ensures DB is never empty)
            print("Deleting all existing availability data...")
            try:
                # Delete all records using a condition that matches everything
                # Using gte on created_at with a very old date matches all records
                supabase.table("availability").delete().gte("created_at", "1970-01-01").execute()
                print("  ✓ Deleted all existing availability records")
            except Exception as e:
                print(f"  ⚠️  Warning: Error deleting old data (may not exist): {e}")
            
            # Step 2: Insert all new availability data from latest scrape
            # Note: Supabase has a limit on batch operations, so we'll chunk it
            chunk_size = 1000
            total_inserted = 0
            for i in range(0, len(slots), chunk_size):
                chunk = slots[i:i + chunk_size]
                try:
                    supabase.table("availability").insert(chunk).execute()
                    total_inserted += len(chunk)
                    print(f"  Inserted {len(chunk)} slots (batch {i // chunk_size + 1}/{(len(slots) + chunk_size - 1) // chunk_size})")
                except Exception as e:
                    print(f"  ❌ Error inserting batch {i // chunk_size + 1}: {e}")
                    raise  # Re-raise to ensure we know if insertion failed
            
            print(f"✅ Successfully replaced all availability data with {total_inserted} slots from latest scrape")
        else:
            print("⚠️  No availability data found in scrape - keeping existing data to avoid empty database")

    except Exception as e:
        print(f"Error storing data: {e}")
        raise

    return {
        "status": "success",
        "locations_processed": len(locations),
        "slots_processed": len(slots),
        "timestamp": datetime.now().isoformat()
    }


@app.function(
    image=image,
    secrets=[CUSTOM_SECRET],
    schedule=modal.Cron("*/5 * * * *"),  # Run every 5 minutes
)
def scheduled_scrape():
    """
    Scheduled function that runs every 5 minutes
    """
    return scrape_and_store.remote()


@app.local_entrypoint()
def main():
    """
    Local entry point for testing
    Run with: modal run modal_service.py
    """
    result = scrape_and_store.remote()
    print(f"\nScrape completed: {result}")
