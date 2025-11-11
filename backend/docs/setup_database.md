# Quick Database Setup

The CLI is having connection issues. Here's the manual approach:

## Step 1: Run SQL in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `supabase-schema.sql`
5. Paste into the editor
6. Click **Run** or press Cmd+Enter

This will create the `locations` and `availability` tables without touching your existing tables.

## Step 2: Get Your Credentials

1. Go to **Project Settings** (gear icon in sidebar)
2. Click on **API**
3. Copy these values:

### Project URL
```
https://YOUR-PROJECT.supabase.co
```

### API Keys
- **anon/public**: For frontend (has Row Level Security)
- **service_role**: For backend scraper (⚠️ Keep secret! Full database access)

## Step 3: Create .env File

```bash
cp .env.example .env
```

Then edit `.env` with your values:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 4: Test Connection

Run this test:
```bash
python -c "
from supabase import create_client
from dotenv import load_dotenv
import os

load_dotenv()

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

# Test connection
result = supabase.table('locations').select('count').execute()
print('✅ Connected to Supabase!')
print(f'📊 Locations table exists and has {len(result.data)} rows')
"
```

## Done!

Once you see "✅ Connected to Supabase!" you're ready to:
1. Configure Modal secrets
2. Run the scraper
3. Deploy!
