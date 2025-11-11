"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { getLocationWebsiteUrl } from "@/lib/locationSlugs";
import type { LocationWithSlots, Location, Availability } from "@/types";

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
}

export default function CourtMap({ selectedDate }: CourtMapProps) {
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

        // Only include locations with available slots
        const locationsWithAvailability = locationsWithSlots.filter(
          (loc) => loc.availableSlots.length > 0
        );

        setLocations(locationsWithAvailability);
      } catch (err) {
        console.error("Error fetching court data:", err);
        setError("Failed to load court availability. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchCourtData();
  }, [selectedDate]);

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

  if (locations.length === 0) {
    return (
      <div className="h-[600px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">No courts available for {format(selectedDate, "MMMM d, yyyy")}</p>
          <p className="text-gray-500 text-sm mt-2">Try selecting a different date</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Found <span className="font-semibold">{locations.length}</span> locations with available courts
        </p>
      </div>
      <MapComponent locations={locations} />

      {/* List View */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Available Courts List</h3>
        <div className="grid gap-4">
          {locations.map((location) => {
            // Group slots by court
            const courtSlots = location.availableSlots.reduce((acc, slot) => {
              if (!acc[slot.court_name]) {
                acc[slot.court_name] = [];
              }
              acc[slot.court_name].push(slot);
              return acc;
            }, {} as Record<string, typeof location.availableSlots>);

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
                  {Object.entries(courtSlots).map(([courtName, slots]) => {
                    const courtType = slots[0]?.court_type;
                    const courtTypeLabel = courtType === "pickleball" ? "Pickleball" : courtType === "tennis" ? "Tennis" : "";
                    return (
                      <div key={courtName} className="border-t pt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-sm font-semibold text-gray-800">
                            {courtName}
                          </p>
                          {courtTypeLabel && (
                            <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                              courtType === "pickleball" 
                                ? "bg-purple-100 text-purple-700 border border-purple-200"
                                : "bg-blue-100 text-blue-700 border border-blue-200"
                            }`}>
                              {courtTypeLabel}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {slots.map((slot) => {
                            const websiteUrl = getLocationWebsiteUrl(location.name);
                            const timeStr = format(new Date(`2000-01-01T${slot.time}`), "h:mm a");
                            
                            if (websiteUrl) {
                              return (
                                <a
                                  key={slot.id}
                                  href={websiteUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-block px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 text-sm rounded-md hover:bg-green-100 transition-colors cursor-pointer"
                                >
                                  {timeStr}
                                </a>
                              );
                            }
                            
                            return (
                              <span
                                key={slot.id}
                                className="inline-block px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 text-sm rounded-md"
                              >
                                {timeStr}
                              </span>
                            );
                          })}
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
