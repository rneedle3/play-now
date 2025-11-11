# Fix Supabase CLI Connection

## Step 1: Login in Your Terminal

Open your terminal and run:
```bash
cd /Users/rneedle/Development/play-now
supabase login
```

This will:
1. Open your browser
2. Ask you to authorize the CLI
3. Save your access token

## Step 2: Link Your Project

After logging in successfully, link to your project:
```bash
supabase link --project-ref isvkihqeizhtbaiysmoh
```

Enter your database password when prompted (the one you set when creating the project).

## Step 3: Push the Schema

```bash
supabase db push
```

This should now work and create the tables!

## Alternative: Use Direct SQL (Faster)

If CLI is still giving issues, just use the Supabase Dashboard:

1. Go to https://supabase.com/dashboard
2. Click SQL Editor
3. Copy contents of `supabase-schema.sql`
4. Paste and Run

Then skip straight to testing the connection with:
```bash
source venv/bin/activate
python test_supabase_connection.py
```

## Which Way Do You Want?

**Option A (CLI)**: Run the commands above in your terminal
**Option B (Dashboard)**: Use SQL Editor in dashboard (faster, no auth issues)

Let me know which you prefer or if you hit any issues!
