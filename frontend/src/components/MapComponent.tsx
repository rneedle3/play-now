"use client";

import { useEffect, useRef, useMemo } from "react";
import L from "leaflet";
import { format } from "date-fns";
import type { LocationWithSlots } from "@/types";
import { getLocationWebsiteUrl } from "@/lib/locationSlugs";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon in Next.js
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapComponentProps {
  locations: LocationWithSlots[];
}

export default function MapComponent({ locations }: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // San Francisco center coordinates
  const SF_CENTER: [number, number] = [37.7749, -122.4194];

  // Calculate center based on locations with coordinates
  const validLocations = useMemo(
    () => locations.filter((loc) => loc.lat && loc.lng),
    [locations]
  );

  const center: [number, number] = useMemo(() => {
    if (validLocations.length > 0) {
      return [
        validLocations.reduce((sum, loc) => sum + (loc.lat || 0), 0) / validLocations.length,
        validLocations.reduce((sum, loc) => sum + (loc.lng || 0), 0) / validLocations.length,
      ];
    }
    return SF_CENTER;
  }, [validLocations]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up existing map
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Initialize map
    const map = L.map(containerRef.current).setView(center, 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Add markers
    validLocations.forEach((location) => {
      if (!location.lat || !location.lng) return;

      // Group slots by court
      const courtSlots = location.availableSlots.reduce((acc, slot) => {
        if (!acc[slot.court_name]) {
          acc[slot.court_name] = [];
        }
        acc[slot.court_name].push(slot);
        return acc;
      }, {} as Record<string, typeof location.availableSlots>);

      // Get website URL for this location
      const websiteUrl = getLocationWebsiteUrl(location.name);

      // Create popup content
      const popupContent = document.createElement("div");
      popupContent.className = "p-2";
      popupContent.innerHTML = `
        <h3 class="font-bold text-lg mb-1">${location.name}</h3>
        ${location.address ? `<p class="text-sm text-gray-600 mb-3">${location.address}</p>` : ""}
        <div class="space-y-3">
          <div class="flex items-center justify-between text-sm">
            <span class="font-semibold">${location.availableSlots.length} available slots</span>
            <span class="text-gray-600">$${(location.availableSlots[0]?.price_cents || 0) / 100}/hr</span>
          </div>
          ${Object.entries(courtSlots)
            .map(
              ([courtName, slots]) => {
                const courtType = slots[0]?.court_type;
                const courtTypeLabel = courtType === "pickleball" ? "Pickleball" : courtType === "tennis" ? "Tennis" : "";
                const courtTypeBadge = courtTypeLabel
                  ? `<span class="inline-block px-2 py-0.5 text-xs font-medium rounded ml-2 ${
                      courtType === "pickleball"
                        ? "bg-purple-100 text-purple-700 border border-purple-200"
                        : "bg-blue-100 text-blue-700 border border-blue-200"
                    }">${courtTypeLabel}</span>`
                  : "";
                return `
            <div class="border-t pt-2">
              <div class="flex items-center mb-1">
                <p class="font-semibold text-sm">${courtName}</p>
                ${courtTypeBadge}
              </div>
              <div class="flex flex-wrap gap-1">
                ${slots
                  .slice(0, 6)
                  .map(
                    (slot, index) => {
                      const timeStr = format(new Date(`2000-01-01T${slot.time}`), "h:mm a");
                      return websiteUrl
                        ? `<a href="${websiteUrl}" target="_blank" rel="noopener noreferrer" class="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded hover:bg-green-200 cursor-pointer transition-colors" data-slot-index="${index}">${timeStr}</a>`
                        : `<span class="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded">${timeStr}</span>`;
                    }
                  )
                  .join("")}
                ${
                  slots.length > 6
                    ? `<span class="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">+${slots.length - 6} more</span>`
                    : ""
                }
              </div>
            </div>
          `;
              }
            )
            .join("")}
        </div>
      `;

      const marker = L.marker([location.lat, location.lng], { icon })
        .addTo(map)
        .bindPopup(popupContent, { maxWidth: 300 });
    });

    mapRef.current = map;

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [validLocations, center]);

  return (
    <div className="h-[600px] rounded-lg overflow-hidden border border-gray-200">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
