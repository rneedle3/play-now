"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { getLocationWebsiteUrl } from "@/lib/locationSlugs";
import type { LocationWithSlots, Location, Availability } from "@/types";
import type { SportFilter } from "@/app/page";

// Dynamically import map to avoid SSR issues
const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading map...</p>
      </div>
    </div>
  ),
});

interface CourtMapProps {
  selectedDate: Date;
  sportFilter: SportFilter;
}

export default function CourtMap({ selectedDate, sportFilter }: CourtMapProps) {
  const [locations, setLocations] = useState<LocationWithSlots[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCourtData() {
      setLoading(true);
      setError(null);

      try {
        const dateStr = format(selectedDate, "yyyy-MM-dd");

        // Fetch all locations
        const { data: locationsData, error: locationsError } = await supabase
          .from("locations")
          .select("*")
          .order("name");

        if (locationsError) throw locationsError;

        // Fetch availability for selected date
        const { data: availabilityData, error: availabilityError } = await supabase
          .from("availability")
          .select("*")
          .eq("date", dateStr)
          .eq("is_available", true)
          .order("time");

        if (availabilityError) throw availabilityError;

        // Group availability by location
        const locationsWithSlots: LocationWithSlots[] = (locationsData as Location[]).map((location) => ({
          ...location,
          availableSlots: (availabilityData as Availability[]).filter(
            (slot) => slot.location_id === location.id
          ),
        }));

        // Include all locations (both available and unavailable)
        setLocations(locationsWithSlots);
      } catch (err) {
        console.error("Error fetching court data:", err);
        setError("Failed to load court availability. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchCourtData();
  }, [selectedDate]);

  // Filter locations based on sport filter (must be before conditional returns)
  const filteredLocations = useMemo(() => {
    return locations.map((location) => {
      let filteredSlots = location.availableSlots;
      
      if (sportFilter !== "both") {
        filteredSlots = location.availableSlots.filter((slot) => {
          const slotSport = slot.court_type || "";
          return slotSport === sportFilter;
        });
      }
      
      return {
        ...location,
        availableSlots: filteredSlots,
      };
    });
  }, [locations, sportFilter]);

  if (loading) {
    return (
      <div className="h-[600px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading court availability...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[600px] bg-red-50 rounded-lg flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  // Filter locations with coordinates
  const locationsWithCoordinates = filteredLocations.filter((loc) => loc.lat && loc.lng);
  
  if (locationsWithCoordinates.length === 0) {
    return (
      <div className="h-[600px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">No locations found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing <span className="font-semibold">{filteredLocations.filter(loc => loc.availableSlots.length > 0).length}</span> locations with available courts
          {filteredLocations.filter(loc => loc.availableSlots.length === 0).length > 0 && (
            <span className="ml-2 text-gray-500">
              ({filteredLocations.filter(loc => loc.availableSlots.length === 0).length} unavailable)
            </span>
          )}
        </p>
      </div>
      <MapComponent locations={filteredLocations} />

      {/* List View */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Available Courts List</h3>
        <div className="grid gap-4">
          {filteredLocations.filter(loc => loc.availableSlots.length > 0).map((location) => {
            return (
              <div
                key={location.id}
                className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{location.name}</h4>
                    {location.address && (
                      <p className="text-sm text-gray-600 mt-1">{location.address}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      ${(location.availableSlots[0]?.price_cents || 0) / 100}/hr
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {location.availableSlots.length} slots
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {Object.entries(
                    // Group slots by sport type instead of court
                    location.availableSlots.reduce((acc, slot) => {
                      const sportType = slot.court_type || "other";
                      if (!acc[sportType]) {
                        acc[sportType] = [];
                      }
                      acc[sportType].push(slot);
                      return acc;
                    }, {} as Record<string, typeof location.availableSlots>)
                  )
                    .sort(([sportTypeA], [sportTypeB]) => {
                      // Sort by sport type: tennis first, then pickleball, then others
                      const getSortOrder = (type: string) => {
                        if (type === "tennis") return 0;
                        if (type === "pickleball") return 1;
                        return 2;
                      };
                      return getSortOrder(sportTypeA) - getSortOrder(sportTypeB);
                    })
                    .map(([sportType, slots]) => {
                      const sportTypeLabel = sportType === "pickleball" ? "Pickleball" : sportType === "tennis" ? "Tennis" : "Other";
                      return (
                        <div key={sportType} className="border-t pt-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                              sportType === "pickleball" 
                                ? "bg-purple-100 text-purple-700 border border-purple-200"
                                : "bg-blue-100 text-blue-700 border border-blue-200"
                            }`}>
                              {sportTypeLabel}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(() => {
                              // Deduplicate slots by time + duration (keep only unique combinations)
                              const uniqueSlotsMap = slots.reduce((acc, slot) => {
                                const key = `${slot.time}-${slot.duration_minutes || 'no-duration'}`;
                                if (!acc.has(key)) {
                                  acc.set(key, slot);
                                }
                                return acc;
                              }, new Map());
                              
                              // Sort unique slots by time
                              const uniqueSlots = Array.from(uniqueSlotsMap.values()).sort((a, b) => a.time.localeCompare(b.time));
                              
                              return uniqueSlots.map((slot) => {
                                const websiteUrl = getLocationWebsiteUrl(location.name);
                                const timeStr = format(new Date(`2000-01-01T${slot.time}`), "h:mm a");
                                const duration = slot.duration_minutes;
                                
                                if (websiteUrl) {
                                  return (
                                    <a
                                      key={`${slot.time}-${slot.duration_minutes || 'no-duration'}`}
                                      href={websiteUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex flex-col items-center justify-center px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 text-sm rounded-md hover:bg-green-100 transition-colors cursor-pointer min-w-[70px]"
                                    >
                                      <span className="font-medium">{timeStr}</span>
                                      {duration && (
                                        <span className="text-xs text-green-600 mt-0.5">{duration} min</span>
                                      )}
                                    </a>
                                  );
                                }
                                
                                return (
                                  <span
                                    key={`${slot.time}-${slot.duration_minutes || 'no-duration'}`}
                                    className="inline-flex flex-col items-center justify-center px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 text-sm rounded-md min-w-[70px]"
                                  >
                                    <span className="font-medium">{timeStr}</span>
                                    {duration && (
                                      <span className="text-xs text-green-600 mt-0.5">{duration} min</span>
                                    )}
                                  </span>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
