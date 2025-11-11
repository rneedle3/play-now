export interface Location {
  id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  hours_of_operation: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Availability {
  id: string;
  location_id: string;
  location_name: string;
  court_id: string;
  court_name: string;
  slot_datetime: string;
  date: string;
  time: string;
  price_cents: number;
  price_type: string;
  court_type: string | null; // "tennis" or "pickleball"
  is_available: boolean;
  created_at: string;
}

export interface LocationWithSlots extends Location {
  availableSlots: Availability[];
}
