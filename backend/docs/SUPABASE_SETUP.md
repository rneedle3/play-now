# Supabase Setup Guide

Quick guide to set up Supabase for the Play Now project.

## Step 1: Login to Supabase CLI

```bash
supabase login
```

This will open your browser for authentication.

## Step 2: Initialize Supabase in Project

```bash
supabase init
```

This creates a `supabase/` directory with configuration files.

## Step 3: Link to Remote Project

### Option A: Link to Existing Project
```bash
supabase link --project-ref your-project-ref
```

To find your project ref:
- Go to https://supabase.com/dashboard
- Click on your project
- Project ref is in the URL: `https://supabase.com/dashboard/project/YOUR-PROJECT-REF`

### Option B: Create New Project (via Dashboard)
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in:
   - Name: `play-now` or `sf-court-tracker`
   - Database Password: (generate a strong one)
   - Region: Choose closest to SF (e.g., `us-west-1`)
4. Wait for project to be created (~2 minutes)
5. Then run: `supabase link --project-ref your-project-ref`

## Step 4: Push Database Schema

```bash
supabase db push
```

Or run the schema manually:
```bash
# Copy the schema to Supabase migrations
cp supabase-schema.sql supabase/migrations/$(date +%Y%m%d%H%M%S)_initial_schema.sql

# Push to remote
supabase db push
```

## Step 5: Get Your Credentials

### Method 1: Via CLI
```bash
# Get project URL
supabase status | grep "API URL"

# Get service role key (for backend)
supabase status | grep "service_role key"

# Get anon key (for frontend)
supabase status | grep "anon key"
```

### Method 2: Via Dashboard
1. Go to Project Settings > API
2. Copy:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: For frontend (read-only with RLS)
   - **service_role key**: For backend (full access, keep secret!)

## Step 6: Configure Environment

Create `.env` file:
```bash
cp .env.example .env
```

Fill in your credentials:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
```

## Step 7: Test Connection

Create a test script:
```python
from supabase import create_client
from dotenv import load_dotenv
import os

load_dotenv()

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

# Test: List tables
result = supabase.table("locations").select("*").limit(1).execute()
print(f"✅ Connected! Tables exist: {len(result.data) >= 0}")
```

## Step 8: Verify Schema

```bash
# List all tables
supabase db diff

# Or check via SQL
supabase db query "SELECT tablename FROM pg_tables WHERE schemaname='public';"
```

You should see:
- `locations`
- `availability`

## Next Steps

Once Supabase is set up:

1. **Configure Modal secrets**:
   ```bash
   modal secret create custom-secret \
     MODAL_TOKEN_ID="your-modal-token-id" \
     MODAL_TOKEN_SECRET="your-modal-token-secret" \
     SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" \
     SUPABASE_URL="your-url"
   ```

2. **Test the full flow**:
   ```bash
   modal run modal_service.py
   ```

3. **Deploy**:
   ```bash
   modal deploy modal_service.py
   ```

## Troubleshooting

### Can't login?
```bash
supabase logout
supabase login
```

### Project link issues?
```bash
supabase unlink
supabase link --project-ref your-ref
```

### Schema not applying?
Run SQL manually in Supabase Dashboard:
1. Go to SQL Editor
2. Paste contents of `supabase-schema.sql`
3. Run the query

### Check logs
```bash
supabase functions deploy --no-verify-jwt
supabase logs
```
