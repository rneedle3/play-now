# Play Now - SF Court Availability Tracker

A real-time court availability tracker for San Francisco tennis and pickleball courts. Displays up-to-date information from SF RecPark's reservation system.

## Architecture

- **Frontend**: Next.js with TypeScript and Tailwind CSS
- **Backend**: Modal (Python serverless functions)
- **Database**: Supabase (PostgreSQL)
- **Data Source**: rec.us API (SF RecPark's official reservation system)

## Features

- ✅ Scrapes 27 SF RecPark court locations
- ✅ Real-time availability data
- ✅ Court details (name, address, coordinates)
- ✅ Pricing information
- ✅ Automated updates every 30 minutes
- ✅ Interactive map showing available courts
- ✅ Date selector for choosing availability
- ✅ Next.js frontend with Supabase integration

## Project Structure

```
play-now/
├── backend/                   # Python backend
│   ├── scraper.py            # Pure scraping logic (no Modal/Supabase)
│   ├── modal_service.py      # Modal deployment and Supabase integration
│   ├── test_scraper.py       # Local test suite for scraper
│   ├── populate_database.py  # Initial database population
│   ├── requirements.txt      # Python dependencies
│   ├── .env.example          # Backend environment variables template
│   │
│   ├── docs/                 # Documentation
│   │   ├── SETUP.md          # Detailed setup instructions
│   │   ├── SUPABASE_SETUP.md # Supabase-specific setup
│   │   └── setup_database.md # Database setup guide
│   │
│   ├── scripts/              # Utility scripts
│   │   ├── fetch_location_ids.py
│   │   ├── test_supabase_connection.py
│   │   └── debug_api.py
│   │
│   ├── data/                 # Generated data (gitignored)
│   ├── temp/                 # Temporary files (gitignored)
│   └── venv/                 # Python virtual environment (gitignored)
│
├── frontend/                  # Next.js frontend
│   ├── src/
│   │   ├── app/              # Next.js app directory
│   │   │   ├── layout.tsx    # Root layout
│   │   │   ├── page.tsx      # Home page
│   │   │   └── globals.css   # Global styles
│   │   ├── components/       # React components
│   │   │   ├── DateSelector.tsx
│   │   │   ├── CourtMap.tsx
│   │   │   └── MapComponent.tsx
│   │   ├── lib/              # Utilities
│   │   │   └── supabase.ts   # Supabase client
│   │   └── types/            # TypeScript types
│   │       └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   └── .env.example          # Frontend environment variables template
│
├── supabase/                  # Supabase CLI configuration
│   └── migrations/           # Database migrations
│
├── supabase-schema.sql        # Database schema for Supabase
└── README.md                  # This file
```

## Court Locations

The scraper tracks all 27 SF RecPark tennis court locations:
- Alice Marble, Balboa, Buena Vista, Crocker Amazon, Dolores
- DuPont, Fulton, Glen Canyon, Hamilton, Jackson
- Joe DiMaggio, J.P. Murphy, Lafayette, McLaren
- Minnie & Lovie Ward, Miraloma, Moscone, Mountain Lake
- Parkside Square, Potrero Hill, Presidio Wall, Richmond
- Rossi, Stern Grove, St. Mary's, Sunset, Upper Noe

## Quick Start

### Prerequisites
- Python 3.7+
- Node.js 18+
- Modal account ([modal.com](https://modal.com))
- Supabase account ([supabase.com](https://supabase.com))

### Backend Setup

1. **Setup Python environment**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Test the scraper locally** (no Modal or Supabase needed)
   ```bash
   python test_scraper.py
   ```
   This scrapes all 27 locations and:
   - Fetches live data from rec.us API
   - Shows availability for each court location
   - Displays location details (name, address, coordinates)
   - Validates data structure for Supabase
   - Saves complete data to `scraped_data_full.json`

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the SQL from `supabase-schema.sql` in the SQL Editor
   - Copy your Project URL, service_role key, and anon key

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

5. **Populate database**
   ```bash
   python populate_database.py
   ```

6. **Configure and deploy Modal**
   ```bash
   modal setup  # Authenticate
   modal secret create custom-secret \
     MODAL_TOKEN_ID="your-modal-token-id" \
     MODAL_TOKEN_SECRET="your-modal-token-secret" \
     SUPABASE_SERVICE_ROLE_KEY="your-service-key" \
     SUPABASE_URL="your-url"
   modal deploy modal_service.py
   ```

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase URL and anon key
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Open browser**
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - Select a date to view available courts
   - Click on map markers to see court details and time slots

The backend scraper will update the database automatically every 30 minutes via Modal!

## How It Works

### Data Flow

1. **Scraper** fetches court data from `api.rec.us/v1/locations/{id}`
2. **Parses** location details, courts, and available time slots
3. **Stores** in Supabase tables:
   - `locations` - Court location info
   - `availability` - Available time slots with pricing
4. **Updates** every 30 minutes via Modal cron job

### API Details

The rec.us API provides:
- Location details (name, address, coordinates, hours)
- Individual court information
- Available time slots (datetime format)
- Pricing (in cents)
- Reservation policies

## Database Schema

### `locations` table
- id, name, address, lat/lng, hours_of_operation, description

### `availability` table
- location_id, court_id, court_name
- slot_datetime, date, time
- price_cents, price_type
- is_available

## Development

### Backend Development

**Run Test Scraper**
```bash
cd backend
source venv/bin/activate
python test_scraper.py
```

The test scraper will:
- **Scrape all 27 locations** from SF RecPark
- **Display availability** by date and location
- **Show location details** with addresses
- **Validate data structure** for Supabase compatibility
- **Save complete results** to `scraped_data_full.json`

**Re-fetch Location IDs**

If SF RecPark adds new courts:
```bash
cd backend
python scripts/fetch_location_ids.py
# Copy output to scraper.py LOCATIONS list
```

**View Modal Logs**
```bash
modal app logs sf-court-scraper --follow
```

**Query Supabase Data**
```sql
-- See today's available slots
SELECT * FROM availability_with_location
WHERE date = CURRENT_DATE
ORDER BY time;

-- Count by location
SELECT location_name, COUNT(*) as slots
FROM availability
WHERE date >= CURRENT_DATE
GROUP BY location_name;
```

### Frontend Development

**Development Server**
```bash
cd frontend
npm run dev
```

**Build for Production**
```bash
cd frontend
npm run build
npm start
```

**Lint and Type Check**
```bash
cd frontend
npm run lint
npx tsc --noEmit
```

## Future Enhancements

- [ ] Add filters for price range and court type
- [ ] Implement location search/filtering
- [ ] Add user favorites/notifications
- [ ] Mobile app version
- [ ] Real-time updates (websockets)
- [ ] Historical availability data and analytics

## Resources

- [SF RecPark Tennis Courts](https://sfrecpark.org/1446/Reservable-Tennis-Courts)
- [Modal Documentation](https://modal.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [SETUP.md](./SETUP.md) - Detailed setup guide

## License

MIT
