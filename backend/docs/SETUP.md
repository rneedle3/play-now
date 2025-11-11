# Play Now - Setup Instructions

Backend setup for SF Court Availability Tracker using Modal + Supabase + Python.

## Architecture

- **Backend**: Modal (Python serverless functions)
- **Database**: Supabase (PostgreSQL)
- **Data Source**: rec.us API
- **Scraper**: Requests library

## Step 1: Set Up Supabase

### 1.1 Create Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the database to initialize

### 1.2 Run the Schema
1. In your Supabase project, go to **SQL Editor**
2. Create a new query
3. Copy the contents of `supabase-schema.sql`
4. Paste and run the SQL script
5. Verify that the `locations` and `availability` tables were created

### 1.3 Get Your Credentials
1. Go to **Project Settings** > **API**
2. Copy your:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Service Role Key** (secret, use this for the scraper)

**Important**: Use the **service_role** key (not the anon key) for the scraper since it needs write access.

## Step 2: Set Up Modal

### 2.1 Install Modal
```bash
pip install modal
```

### 2.2 Authenticate Modal
```bash
modal setup
```

This will open a browser window to authenticate.

### 2.3 Create Modal Secrets
```bash
# Create a single custom-secret with all required environment variables
modal secret create custom-secret \
  MODAL_TOKEN_ID="your-modal-token-id" \
  MODAL_TOKEN_SECRET="your-modal-token-secret" \
  SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here" \
  SUPABASE_URL="https://your-project.supabase.co"
```

## Step 3: Test Locally

### 3.1 Test the Scraper (without Modal)
```bash
# Install dependencies locally
pip install requests

# Run the test
python scraper.py
```

This will fetch Alice Marble courts and print the results without storing to Supabase.

### 3.2 Test with Modal (full flow)
```bash
# Run the scraper function on Modal
modal run scraper.py
```

This will:
- Run the scraper on Modal's infrastructure
- Fetch court data from rec.us API
- Store data in your Supabase database

## Step 4: Deploy to Modal

```bash
# Deploy the app to Modal
modal deploy scraper.py
```

This will:
- Deploy the scraper function
- Set up the scheduled cron job to run every 30 minutes
- Keep your data automatically updated

## Step 5: Verify Data

### Check Supabase Tables
1. Go to your Supabase project
2. Navigate to **Table Editor**
3. Check the `locations` table - should have location info
4. Check the `availability` table - should have time slots

### Query the Data
```sql
-- See all locations
SELECT * FROM locations;

-- See available slots for today
SELECT * FROM availability_with_location
WHERE date = CURRENT_DATE
ORDER BY time;

-- Count available slots by location
SELECT location_name, COUNT(*) as slot_count
FROM availability
WHERE date >= CURRENT_DATE
GROUP BY location_name;
```

## Adding More Locations

To add more courts beyond Alice Marble:

1. Find the court on [https://sfrecpark.org/1446/Reservable-Tennis-Courts](https://sfrecpark.org/1446/Reservable-Tennis-Courts)
2. Click the reservation link (e.g., `https://rec.us/dollorespark`)
3. Open browser DevTools > Network tab
4. Find the API call to `https://api.rec.us/v1/locations/{location_id}`
5. Copy the location ID
6. Add to the `LOCATIONS` list in `scraper.py`:

```python
LOCATIONS = [
    {"name": "Alice Marble", "slug": "alicemarble", "location_id": "81cd2b08-8ea6-40ee-8c89-aeba92506576"},
    {"name": "Dolores Park", "slug": "dolorespark", "location_id": "your-location-id-here"},
    # Add more...
]
```

## Monitoring

### View Modal Logs
```bash
# View recent runs
modal app logs sf-court-scraper

# View live logs
modal app logs sf-court-scraper --follow
```

### Check Scheduled Runs
Go to [https://modal.com](https://modal.com) dashboard to see:
- Scheduled function runs
- Execution logs
- Errors and performance metrics

## Troubleshooting

### "Secret not found" error
Make sure you created the Modal secret:
```bash
modal secret list
```

Should show `custom-secret` with all required keys (MODAL_TOKEN_ID, MODAL_TOKEN_SECRET, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL).

### Supabase authentication errors
- Verify you're using the **service_role** key (not anon key)
- Check that RLS policies are set correctly in the SQL schema

### No data appearing
- Check Modal logs for errors
- Test locally first with `python scraper.py`
- Verify the API is returning data
- Check Supabase table structure matches the schema

## Next Steps

Once the backend is working:
1. Build the Next.js frontend
2. Create API routes to fetch from Supabase
3. Display court availability in the UI
4. Add filtering by date, location, court type
