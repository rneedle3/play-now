"""
SF RecPark Court Availability Scraper
Pure scraping logic without any deployment dependencies
"""

import requests
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple


# All 27 SF RecPark court locations from https://sfrecpark.org/1446/Reservable-Tennis-Courts
# Generated using fetch_location_ids.py
LOCATIONS = [
    {"name": "Alice Marble", "slug": "alicemarble", "location_id": "81cd2b08-8ea6-40ee-8c89-aeba92506576"},
    {"name": "Balboa", "slug": "balboa", "location_id": "c41c7b8f-cb09-415a-b8ea-ad4b82d792b9"},
    {"name": "Buena Vista", "slug": "buenavista", "location_id": "3f842b1e-13f9-447d-ab12-62b62d954d3e"},
    {"name": "Crocker Amazon", "slug": "crockeramazon", "location_id": "779905bd-4c2b-45b3-abd0-48140998bca1"},
    {"name": "Dolores", "slug": "dolores", "location_id": "95745483-6b38-4e99-8ba2-a3e23cda8587"},
    {"name": "DuPont", "slug": "dupont", "location_id": "d3fc78ce-0617-40dc-b7f7-d41ba95f09ef"},
    {"name": "Fulton", "slug": "fulton", "location_id": "070037ab-f407-486a-9f88-989905be1039"},
    {"name": "Glen Canyon", "slug": "glencanyon", "location_id": "16fdf80f-4e50-452a-843f-63d159c798e2"},
    {"name": "Hamilton", "slug": "hamilton", "location_id": "8c3b9b04-a149-4080-b648-e3ff8365bbee"},
    {"name": "Jackson", "slug": "jackson", "location_id": "360736ab-a655-478d-aab5-4e54fea0c140"},
    {"name": "Joe DiMaggio", "slug": "joedimaggio", "location_id": "8f8e510f-e0d8-4364-8531-a9a0d0d6b2b8"},
    {"name": "J.P. Murphy", "slug": "jpmurphy", "location_id": "7a8ef25a-dc20-4046-8aab-7212a9a41d20"},
    {"name": "Lafayette", "slug": "lafayette", "location_id": "c4fc2b3e-d1bc-47d9-b920-76d00d32b20b"},
    {"name": "McLaren", "slug": "mclaren", "location_id": "9d05fa5b-38fc-49b7-88c5-74825703d936"},
    {"name": "Minnie & Lovie Ward", "slug": "minnielovieward", "location_id": "bb6254d3-0ef0-475d-8de9-ac7d6b0323f4"},
    {"name": "Miraloma", "slug": "miraloma", "location_id": "5a52a5e8-2e9f-4976-8a5c-0bc53d51afe9"},
    {"name": "Moscone", "slug": "moscone", "location_id": "fb0d16b1-5f9f-465f-8ebf-fccf5d400c47"},
    {"name": "Mountain Lake", "slug": "mountainlake", "location_id": "af2cd971-0c10-479d-a12e-ca63d55f71be"},
    {"name": "Parkside Square", "slug": "parkside", "location_id": "5a0b8fa6-11db-433e-9314-bafb956d8622"},
    {"name": "Potrero Hill", "slug": "potrerohill", "location_id": "032e605f-6065-4794-9675-b1bbebe18159"},
    {"name": "Presidio Wall", "slug": "presidiowall", "location_id": "c2f20478-83d8-48c9-af3d-065d7ba22d60"},
    {"name": "Richmond", "slug": "richmond", "location_id": "95f7e887-5096-463b-834a-09d67889557e"},
    {"name": "Rossi", "slug": "rossi", "location_id": "ad9e28e1-2d02-4fb5-b31d-b75f63841814"},
    {"name": "Stern Grove", "slug": "sterngrove", "location_id": "1a5a0d4b-ef5d-44ab-a8ab-a13f39dcdc7d"},
    {"name": "St. Mary's", "slug": "stmarys", "location_id": "25eafd72-ca31-4df7-8850-79c05edf3796"},
    {"name": "Sunset", "slug": "sunset", "location_id": "fe61cfdb-abf7-4f52-8ce4-45feb58f10b7"},
    {"name": "Upper Noe", "slug": "uppernoe", "location_id": "2a18ef67-333c-4d9c-a86c-e0709f07f5c3"},
]


def fetch_location_data(location_id: str) -> Optional[Dict]:
    """
    Fetch all courts and availability for a location from rec.us API

    API Endpoint: https://api.rec.us/v1/locations/{location_id}?publishedSites=true
    Returns: Location details with courts array containing availability

    Args:
        location_id: UUID of the location

    Returns:
        Dict with location data or None if request fails
    """
    api_url = f"https://api.rec.us/v1/locations/{location_id}"

    params = {
        "publishedSites": "true"
    }

    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "application/json",
        "Origin": "https://www.rec.us",
        "Referer": "https://www.rec.us/",
    }

    try:
        response = requests.get(api_url, params=params, headers=headers, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching location {location_id}: {e}")
        return None


def parse_location_data(location_data: Dict) -> Tuple[Optional[Dict], List[Dict]]:
    """
    Parse location and court data from API response

    Args:
        location_data: Raw API response from rec.us

    Returns:
        Tuple of (location_info, list_of_availability_slots)
        - location_info: Dict with location details
        - list_of_availability_slots: List of dicts, each representing an available time slot
    """
    if not location_data or "location" not in location_data:
        return None, []

    location = location_data["location"]
    courts = location.get("courts", [])  # courts are nested under location, not top-level

    # Extract location info
    location_info = {
        "id": location["id"],
        "name": location["name"],
        "address": location.get("formattedAddress", ""),
        "lat": float(location["lat"]) if location.get("lat") else None,
        "lng": float(location["lng"]) if location.get("lng") else None,
        "hours_of_operation": location.get("hoursOfOperation", ""),
        "description": location.get("description", ""),
    }

    # Extract all available slots from all courts
    all_slots = []
    for court in courts:
        court_id = court["id"]
        court_number = court.get("courtNumber", "Unknown Court")
        available_slots = court.get("availableSlots", [])

        # Get pricing info
        config = court.get("config", {})
        pricing = config.get("pricing", {}).get("default", {})
        price_cents = pricing.get("cents", 0)
        price_type = pricing.get("type", "perHour")

        # Determine court type from sportId
        # Tennis: 'bd745b6e-1dd6-43e2-a69f-06f094808a96'
        # Pickleball: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
        sports = court.get("sports", [])
        court_type = "tennis"  # default
        if sports:
            sport_id = sports[0].get("sportId", "")
            if sport_id == "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa":
                court_type = "pickleball"
            elif sport_id == "bd745b6e-1dd6-43e2-a69f-06f094808a96":
                court_type = "tennis"

        # Extract fixed slot configurations by day of week (to match real website behavior)
        # The real website only shows slots where the entire duration is available
        # Format: {day_of_week: list of (start_time, end_time, duration_minutes)}
        # day_of_week: 0=Monday, 1=Tuesday, ..., 6=Sunday (Python weekday format)
        fixed_slots_by_day = {}
        booking_policies = config.get("bookingPolicies", [])
        for policy in booking_policies:
            if policy.get("type") == "fixed-slots":
                slots_config = policy.get("slots", [])
                for slot_config in slots_config:
                    day_of_week = slot_config.get("dayOfWeek")  # API uses 1=Monday, 2=Tuesday, etc.
                    start_time = slot_config.get("startTimeLocal", "")
                    end_time = slot_config.get("endTimeLocal", "")
                    if start_time and end_time and day_of_week is not None:
                        # Convert API dayOfWeek (1=Monday) to Python weekday (0=Monday)
                        python_weekday = day_of_week - 1
                        if python_weekday not in fixed_slots_by_day:
                            fixed_slots_by_day[python_weekday] = []
                        fixed_slots_by_day[python_weekday].append((start_time, end_time))

        # Create a set of all available slot datetimes for quick lookup
        # Format: "YYYY-MM-DD HH:MM:SS"
        available_slot_datetimes = set(available_slots)

        # Parse each available slot, but only include those where the entire fixed slot duration is available
        # If no fixed slots are configured, include all available slots
        for slot_time in available_slots:
            # slot_time format: "2025-11-11 13:30:00"
            try:
                dt = datetime.strptime(slot_time, "%Y-%m-%d %H:%M:%S")
                slot_time_only = dt.strftime("%H:%M:%S")
                slot_date = dt.strftime("%Y-%m-%d")
                slot_weekday = dt.weekday()  # 0=Monday, 1=Tuesday, ..., 6=Sunday
                
                # Filter: only include slots that match fixed slot start times AND have full duration available
                duration_minutes = None
                if fixed_slots_by_day:
                    day_slots = fixed_slots_by_day.get(slot_weekday, [])
                    # Check if this time is a start time of a fixed slot
                    is_valid_start = False
                    for start_time, end_time in day_slots:
                        if slot_time_only == start_time:
                            # Verify that all 30-minute increments within this slot are available for this specific date
                            # Parse start and end times
                            start_dt = datetime.strptime(start_time, "%H:%M:%S")
                            end_dt = datetime.strptime(end_time, "%H:%M:%S")
                            
                            # Calculate duration in minutes
                            duration_minutes = int((end_dt - start_dt).total_seconds() / 60)
                            
                            # Check every 30 minutes from start to end (exclusive of end) for this date
                            current_time = start_dt.time()
                            end_time_obj = end_dt.time()
                            all_available = True
                            
                            while current_time < end_time_obj:
                                # Create datetime for this specific date and time
                                check_datetime = datetime.combine(dt.date(), current_time)
                                check_datetime_str = check_datetime.strftime("%Y-%m-%d %H:%M:%S")
                                
                                if check_datetime_str not in available_slot_datetimes:
                                    all_available = False
                                    break
                                
                                # Move to next 30-minute increment
                                current_dt = datetime.combine(dt.date(), current_time)
                                current_dt += timedelta(minutes=30)
                                current_time = current_dt.time()
                            
                            if all_available:
                                is_valid_start = True
                            break
                    
                    if not is_valid_start:
                        continue
                else:
                    # If no fixed slots configured, try to determine duration from maxReservationTime or default to 30
                    max_reservation_time = court.get("maxReservationTime", "00:30:00")
                    try:
                        # Parse time like "01:30:00" and calculate minutes
                        time_parts = max_reservation_time.split(":")
                        if len(time_parts) >= 2:
                            hours = int(time_parts[0])
                            minutes = int(time_parts[1])
                            duration_minutes = hours * 60 + minutes
                        else:
                            duration_minutes = 30
                    except (ValueError, TypeError, IndexError):
                        duration_minutes = 30  # Default to 30 minutes if we can't determine

                all_slots.append({
                    "location_id": location["id"],
                    "location_name": location["name"],
                    "court_id": court_id,
                    "court_name": court_number,
                    "slot_datetime": slot_time,
                    "date": dt.strftime("%Y-%m-%d"),
                    "time": dt.strftime("%H:%M:%S"),
                    "price_cents": price_cents,
                    "price_type": price_type,
                    "court_type": court_type,
                    "duration_minutes": duration_minutes,
                    "is_available": True,
                })
            except ValueError as e:
                print(f"Error parsing slot time {slot_time}: {e}")
                continue

    return location_info, all_slots


def scrape_all_locations() -> Tuple[List[Dict], List[Dict]]:
    """
    Scrape all 27 SF RecPark court locations

    Returns:
        Tuple of (locations, availability_slots)
        - locations: List of location info dicts
        - availability_slots: List of available time slot dicts
    """
    all_locations = []
    all_slots = []

    print(f"Starting scrape of {len(LOCATIONS)} locations at {datetime.now()}")

    for location in LOCATIONS:
        print(f"  Scraping {location['name']}...", end=" ")

        # Fetch location data
        location_data = fetch_location_data(location["location_id"])

        if location_data:
            # Parse location and slots
            location_info, slots = parse_location_data(location_data)

            if location_info:
                all_locations.append(location_info)
                all_slots.extend(slots)
                print(f"✓ {len(slots)} slots")
            else:
                print("✗ Failed to parse")
        else:
            print("✗ Failed to fetch")

    print(f"\nScrape completed: {len(all_locations)} locations, {len(all_slots)} total slots")

    return all_locations, all_slots


def get_location_by_slug(slug: str) -> Optional[Dict]:
    """
    Get location details by slug

    Args:
        slug: Location slug (e.g., 'alicemarble')

    Returns:
        Location dict or None if not found
    """
    for location in LOCATIONS:
        if location["slug"] == slug:
            return location
    return None


def get_location_by_id(location_id: str) -> Optional[Dict]:
    """
    Get location details by ID

    Args:
        location_id: Location UUID

    Returns:
        Location dict or None if not found
    """
    for location in LOCATIONS:
        if location["location_id"] == location_id:
            return location
    return None
