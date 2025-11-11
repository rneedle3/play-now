"""
Test script for the SF RecPark court scraper
Scrapes all 27 locations and validates the data
"""

import json
from datetime import datetime
from scraper import (
    scrape_all_locations,
    fetch_location_data,
    parse_location_data,
    get_location_by_slug,
    LOCATIONS
)


def display_availability_summary(slots):
    """Display a summary of available slots"""
    if not slots:
        print("\n⚠️  No available slots found at any location")
        print("   (All courts may be fully booked or reservations not yet released)")
        return

    # Group by date
    by_date = {}
    for slot in slots:
        date = slot['date']
        if date not in by_date:
            by_date[date] = []
        by_date[date].append(slot)

    print("\n" + "-" * 60)
    print("AVAILABILITY BY DATE:")
    print("-" * 60)

    for date in sorted(by_date.keys())[:7]:  # Show first 7 days
        date_slots = by_date[date]
        print(f"\n📅 {date} ({len(date_slots)} slots):")

        # Group by location for this date
        by_location = {}
        for slot in date_slots:
            loc = slot['location_name']
            if loc not in by_location:
                by_location[loc] = []
            by_location[loc].append(slot)

        # Show top 5 locations with most availability
        for loc, loc_slots in sorted(by_location.items(), key=lambda x: len(x[1]), reverse=True)[:5]:
            times = [s['time'][:5] for s in sorted(loc_slots, key=lambda x: x['time'])[:3]]  # First 3 times
            time_str = ", ".join(times)
            if len(loc_slots) > 3:
                time_str += f" +{len(loc_slots) - 3} more"
            print(f"  🎾 {loc}: {time_str}")


def display_location_details(locations, slots):
    """Display detailed info about locations"""
    print("\n" + "-" * 60)
    print("LOCATION DETAILS:")
    print("-" * 60)

    # Count slots per location
    location_counts = {}
    for slot in slots:
        loc = slot['location_name']
        location_counts[loc] = location_counts.get(loc, 0) + 1

    # Show all locations
    for location in locations:
        count = location_counts.get(location['name'], 0)
        status = "✓" if count > 0 else "○"
        print(f"{status} {location['name']}: {count} slots")
        if location['address']:
            print(f"  📍 {location['address']}")


def validate_data_structure(locations, slots):
    """Validate that data structure is correct for Supabase"""
    print("\n" + "-" * 60)
    print("DATA VALIDATION:")
    print("-" * 60)

    errors = []

    # Check locations
    if locations:
        loc = locations[0]
        required_fields = ["id", "name", "address", "lat", "lng", "hours_of_operation", "description"]
        for field in required_fields:
            if field not in loc:
                errors.append(f"Location missing field: {field}")

    # Check slots
    if slots:
        slot = slots[0]
        required_fields = [
            "location_id", "location_name", "court_id", "court_name",
            "slot_datetime", "date", "time", "price_cents", "price_type", "is_available"
        ]
        for field in required_fields:
            if field not in slot:
                errors.append(f"Slot missing field: {field}")

        # Validate date/time format
        try:
            datetime.strptime(slot['date'], "%Y-%m-%d")
            datetime.strptime(slot['time'], "%H:%M:%S")
        except ValueError as e:
            errors.append(f"Invalid datetime format: {e}")

    if errors:
        print("❌ Validation errors found:")
        for error in errors:
            print(f"  - {error}")
        return False
    else:
        print("✅ All data structures valid")
        print("✅ Ready for Supabase integration")
        return True


def save_full_data(locations, slots):
    """Save complete scraped data to JSON"""
    data = {
        "scraped_at": datetime.now().isoformat(),
        "total_locations": len(locations),
        "total_slots": len(slots),
        "locations": locations,
        "availability": slots,
    }

    with open("scraped_data_full.json", "w") as f:
        json.dump(data, f, indent=2)

    print(f"\n💾 Saved complete data to scraped_data_full.json")
    print(f"   - {len(locations)} locations")
    print(f"   - {len(slots)} availability slots")


def main():
    """Main test function - scrapes all locations"""
    print("\n" + "=" * 70)
    print("SF RECPARK COURT SCRAPER - TESTING ALL 27 LOCATIONS")
    print("=" * 70 + "\n")

    print(f"🎾 Scraping {len(LOCATIONS)} court locations...")
    print(f"⏱️  This will take 30-60 seconds...\n")

    # Scrape all locations
    locations, slots = scrape_all_locations()

    # Results summary
    print("\n" + "=" * 70)
    print("SCRAPING RESULTS:")
    print("=" * 70)
    print(f"✅ Locations scraped: {len(locations)}/{len(LOCATIONS)}")
    print(f"✅ Total available slots: {len(slots):,}")

    # Calculate success rate
    success_rate = (len(locations) / len(LOCATIONS)) * 100
    print(f"✅ Success rate: {success_rate:.1f}%")

    # Display detailed results
    if locations:
        display_location_details(locations, slots)
        display_availability_summary(slots)

    # Validate data structure
    validation_passed = validate_data_structure(locations, slots)

    # Save data
    save_full_data(locations, slots)

    # Final status
    print("\n" + "=" * 70)
    if success_rate == 100 and validation_passed:
        print("🎉 SUCCESS! All locations scraped and data validated.")
        print("📊 Data is ready for Supabase integration.")
    elif success_rate >= 90:
        print("✅ MOSTLY SUCCESSFUL! Some locations may have failed.")
    else:
        print("⚠️  PARTIAL SUCCESS. Please check errors above.")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    main()
