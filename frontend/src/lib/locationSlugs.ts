// Mapping of location names to their rec.us slugs
// This matches the LOCATIONS array in backend/scraper.py
export const LOCATION_SLUGS: Record<string, string> = {
  "Alice Marble": "alicemarble",
  "Balboa": "balboa",
  "Buena Vista": "buenavista",
  "Crocker Amazon": "crockeramazon",
  "Dolores": "dolores",
  "DuPont": "dupont",
  "Fulton": "fulton",
  "Glen Canyon": "glencanyon",
  "Hamilton": "hamilton",
  "Jackson": "jackson",
  "Joe DiMaggio": "joedimaggio",
  "J.P. Murphy": "jpmurphy",
  "Lafayette": "lafayette",
  "McLaren": "mclaren",
  "Minnie & Lovie Ward": "minnielovieward",
  "Miraloma": "miraloma",
  "Moscone": "moscone",
  "Mountain Lake": "mountainlake",
  "Parkside Square": "parkside",
  "Potrero Hill": "potrerohill",
  "Presidio Wall": "presidiowall",
  "Richmond": "richmond",
  "Rossi": "rossi",
  "Stern Grove": "sterngrove",
  "St. Mary's": "stmarys",
  "Sunset": "sunset",
  "Upper Noe": "uppernoe",
};

/**
 * Get the website URL for a location by name
 */
export function getLocationWebsiteUrl(locationName: string): string | null {
  const slug = LOCATION_SLUGS[locationName];
  return slug ? `https://rec.us/${slug}` : null;
}

