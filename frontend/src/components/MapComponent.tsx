"use client";

import { useEffect, useRef, useMemo } from "react";
import L from "leaflet";
import { format } from "date-fns";
import type { LocationWithSlots } from "@/types";
import { getLocationWebsiteUrl } from "@/lib/locationSlugs";
import "leaflet/dist/leaflet.css";

// Green check mark pin icon for available locations
const availableIcon = L.divIcon({
  className: "available-marker",
  html: `
    <div style="
      width: 30px;
      height: 30px;
      background-color: #22c55e;
      border: 3px solid white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 6L9 17L4 12" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
});

// Red X icon for unavailable locations
const unavailableIcon = L.divIcon({
  className: "unavailable-marker",
  html: `
    <div style="
      width: 30px;
      height: 30px;
      background-color: #ef4444;
      border: 3px solid white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">
      <span style="
        color: white;
        font-size: 18px;
        font-weight: bold;
        line-height: 1;
      ">✕</span>
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
});

interface MapComponentProps {
  locations: LocationWithSlots[];
  sportFilter?: "both" | "tennis" | "pickleball";
}

export default function MapComponent({ locations, sportFilter = "both" }: MapComponentProps) {
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

    // Function to calculate popup size (square) based on zoom level
    // Zoom levels typically range from 1-18, with 12 being a good default
    const getPopupSize = (zoom: number): number => {
      // Base size at zoom 12, scales proportionally
      // At zoom 12: ~280px, at zoom 8: ~140px, at zoom 16: ~560px
      const baseZoom = 12;
      const baseSize = 280;
      const scaleFactor = Math.pow(2, (zoom - baseZoom) / 2);
      return Math.max(200, Math.min(500, baseSize * scaleFactor));
    };

    // Function to update popup size when zoom changes
    const updatePopupSizes = () => {
      const zoom = map.getZoom();
      const size = getPopupSize(zoom);
      
      // Update all open popups by directly modifying their DOM elements
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker && layer.isPopupOpen()) {
          const popup = layer.getPopup();
          if (popup) {
            const popupElement = popup.getElement();
            if (popupElement) {
              const wrapper = popupElement.closest('.leaflet-popup-content-wrapper') as HTMLElement;
              if (wrapper) {
                wrapper.style.width = `${size}px`;
                wrapper.style.height = `${size}px`;
                wrapper.style.maxWidth = `${size}px`;
                wrapper.style.maxHeight = `${size}px`;
              }
            }
          }
        }
      });
    };

    // Listen to zoom events
    map.on('zoomend', updatePopupSizes);
    map.on('zoom', updatePopupSizes);

    // Add markers
    validLocations.forEach((location) => {
      if (!location.lat || !location.lng) return;

      const isAvailable = location.availableSlots.length > 0;
      const markerIcon = isAvailable ? availableIcon : unavailableIcon;

      // Get website URL for this location
      const websiteUrl = getLocationWebsiteUrl(location.name);

      // Create popup content with square scrollable container
      const popupContent = document.createElement("div");
      popupContent.className = "popup-container";
      
      if (isAvailable) {
        // Group slots by sport type instead of court
        const sportSlots = location.availableSlots.reduce((acc, slot) => {
          const sportType = slot.court_type || "other";
          if (!acc[sportType]) {
            acc[sportType] = [];
          }
          acc[sportType].push(slot);
          return acc;
        }, {} as Record<string, typeof location.availableSlots>);

        popupContent.innerHTML = `
          <div class="popup-header">
            <h3 class="font-bold text-sm sm:text-lg mb-1">${location.name}</h3>
            ${location.address ? `<p class="text-xs sm:text-sm text-gray-600">${location.address}</p>` : ""}
            <div class="flex items-center justify-between text-xs sm:text-sm mt-2">
              <span class="font-semibold">${location.availableSlots.length} available slots</span>
              <span class="text-gray-600">$${(location.availableSlots[0]?.price_cents || 0) / 100}/hr</span>
            </div>
          </div>
          <div class="popup-scrollable">
            <div class="space-y-3">
              ${Object.entries(sportSlots)
                .sort(([sportTypeA], [sportTypeB]) => {
                  // Sort by sport type: tennis first, then pickleball, then others
                  const getSortOrder = (type: string) => {
                    if (type === "tennis") return 0;
                    if (type === "pickleball") return 1;
                    return 2;
                  };
                  
                  return getSortOrder(sportTypeA) - getSortOrder(sportTypeB);
                })
                .map(
                  ([sportType, slots]) => {
                    const sportTypeLabel = sportType === "pickleball" ? "Pickleball" : sportType === "tennis" ? "Tennis" : "Other";
                    const sportTypeBadge = sportTypeLabel
                      ? `<span class="inline-block px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded ${
                          sportType === "pickleball"
                            ? "bg-purple-100 text-purple-700 border border-purple-200"
                            : "bg-blue-100 text-blue-700 border border-blue-200"
                        }">${sportTypeLabel}</span>`
                      : "";
                    
                    // Deduplicate slots by time + duration (keep only unique combinations)
                    const uniqueSlots = slots.reduce((acc, slot) => {
                      const key = `${slot.time}-${slot.duration_minutes || 'no-duration'}`;
                      if (!acc.has(key)) {
                        acc.set(key, slot);
                      }
                      return acc;
                    }, new Map());
                    
                    // Sort unique slots by time
                    const sortedSlots = Array.from(uniqueSlots.values()).sort((a, b) => a.time.localeCompare(b.time));
                    const slotButtons = sortedSlots
                      .map((slot) => {
                        const timeStr = format(new Date(`2000-01-01T${slot.time}`), "h:mm a");
                        const duration = slot.duration_minutes;
                        const durationHtml = duration ? `<span class="block text-[9px] sm:text-[10px] text-green-600 mt-0.5">${duration} min</span>` : "";
                        const buttonContent = `<span class="block font-medium text-[11px] sm:text-xs">${timeStr}</span>${durationHtml}`;
                        return websiteUrl
                          ? `<a href="${websiteUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex flex-col items-center justify-center px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-100 text-green-800 text-[11px] sm:text-xs rounded hover:bg-green-200 cursor-pointer transition-colors min-w-[50px] sm:min-w-[60px]">${buttonContent}</a>`
                          : `<span class="inline-flex flex-col items-center justify-center px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-100 text-green-800 text-[11px] sm:text-xs rounded min-w-[50px] sm:min-w-[60px]">${buttonContent}</span>`;
                      })
                      .join("");
                    
                    return `
                <div class="court-section">
                  <div class="flex items-center mb-2 flex-wrap">
                    ${sportTypeBadge}
                  </div>
                  <div class="flex flex-wrap gap-1.5">
                    ${slotButtons}
                  </div>
                </div>
              `;
                  }
                )
                .join("")}
            </div>
          </div>
        `;
      } else {
        popupContent.innerHTML = `
          <div class="popup-header">
            <h3 class="font-bold text-sm sm:text-lg mb-1">${location.name}</h3>
            ${location.address ? `<p class="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">${location.address}</p>` : ""}
            <div class="mt-2 sm:mt-3">
              <p class="text-xs sm:text-sm text-red-600 font-semibold">No courts available for this date</p>
            </div>
          </div>
        `;
      }

      // Get initial popup size based on current zoom
      const initialZoom = map.getZoom();
      const initialSize = getPopupSize(initialZoom);

      const marker = L.marker([location.lat, location.lng], { icon: markerIcon })
        .addTo(map)
        .bindPopup(popupContent, { 
          maxWidth: initialSize,
          maxHeight: initialSize,
          className: "leaflet-popup-square"
        });
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
