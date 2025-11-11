"""
Test Supabase connection
Run after setting up .env file
"""

from supabase import create_client
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Get credentials
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: Missing credentials in .env file")
    print("\nMake sure you have:")
    print("  SUPABASE_URL=https://your-project.supabase.co")
    print("  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key")
    exit(1)

print("Testing Supabase connection...")
print(f"URL: {SUPABASE_URL}")
print()

try:
    # Create client
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Client created successfully")

    # Test locations table
    print("\nTesting 'locations' table...")
    result = supabase.table("locations").select("*").limit(1).execute()
    print(f"✅ Locations table exists ({len(result.data)} rows)")

    # Test availability table
    print("\nTesting 'availability' table...")
    result = supabase.table("availability").select("*").limit(1).execute()
    print(f"✅ Availability table exists ({len(result.data)} rows)")

    print("\n" + "=" * 60)
    print("🎉 SUCCESS! Supabase is connected and tables are ready!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Configure Modal secret:")
    print(f'   modal secret create custom-secret \\')
    print(f'     MODAL_TOKEN_ID="your-modal-token-id" \\')
    print(f'     MODAL_TOKEN_SECRET="your-modal-token-secret" \\')
    print(f'     SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" \\')
    print(f'     SUPABASE_URL="{SUPABASE_URL}"')
    print("\n2. Test with Modal:")
    print("   modal run modal_service.py")
    print("\n3. Deploy:")
    print("   modal deploy modal_service.py")

except Exception as e:
    print(f"\n❌ Error: {e}")
    print("\nTroubleshooting:")
    print("1. Make sure you ran the SQL schema in Supabase Dashboard")
    print("2. Check that your credentials are correct in .env")
    print("3. Verify your project is not paused in Supabase Dashboard")
