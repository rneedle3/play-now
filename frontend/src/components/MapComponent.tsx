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

    // Function to calculate popup max width based on zoom level
    // Zoom levels typically range from 1-18, with 12 being a good default
    const getPopupMaxWidth = (zoom: number): number => {
      // Base size at zoom 12, scales proportionally
      // At zoom 12: ~280px, at zoom 8: ~140px, at zoom 16: ~560px
      const baseZoom = 12;
      const baseWidth = 280;
      const scaleFactor = Math.pow(2, (zoom - baseZoom) / 2);
      return Math.max(150, Math.min(600, baseWidth * scaleFactor));
    };

    // Function to update popup size when zoom changes
    const updatePopupSizes = () => {
      const zoom = map.getZoom();
      const maxWidth = getPopupMaxWidth(zoom);
      
      // Update all open popups by directly modifying their DOM elements
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker && layer.isPopupOpen()) {
          const popup = layer.getPopup();
          if (popup) {
            const popupElement = popup.getElement();
            if (popupElement) {
              const wrapper = popupElement.closest('.leaflet-popup-content-wrapper') as HTMLElement;
              if (wrapper) {
                wrapper.style.maxWidth = `${maxWidth}px`;
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
      const markerIcon = isAvailable ? icon : unavailableIcon;

      // Get website URL for this location
      const websiteUrl = getLocationWebsiteUrl(location.name);

      // Create popup content
      const popupContent = document.createElement("div");
      popupContent.className = "p-2 sm:p-3";
      
      if (isAvailable) {
        // Group slots by court
        const courtSlots = location.availableSlots.reduce((acc, slot) => {
          if (!acc[slot.court_name]) {
            acc[slot.court_name] = [];
          }
          acc[slot.court_name].push(slot);
          return acc;
        }, {} as Record<string, typeof location.availableSlots>);

        popupContent.innerHTML = `
          <h3 class="font-bold text-sm sm:text-lg mb-1">${location.name}</h3>
          ${location.address ? `<p class="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">${location.address}</p>` : ""}
          <div class="space-y-2 sm:space-y-3">
            <div class="flex items-center justify-between text-xs sm:text-sm">
              <span class="font-semibold">${location.availableSlots.length} available slots</span>
              <span class="text-gray-600">$${(location.availableSlots[0]?.price_cents || 0) / 100}/hr</span>
            </div>
            ${Object.entries(courtSlots)
              .map(
                ([courtName, slots]) => {
                  const courtType = slots[0]?.court_type;
                  const courtTypeLabel = courtType === "pickleball" ? "Pickleball" : courtType === "tennis" ? "Tennis" : "";
                  const courtTypeBadge = courtTypeLabel
                    ? `<span class="inline-block px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded ml-1 sm:ml-2 ${
                        courtType === "pickleball"
                          ? "bg-purple-100 text-purple-700 border border-purple-200"
                          : "bg-blue-100 text-blue-700 border border-blue-200"
                      }">${courtTypeLabel}</span>`
                    : "";
                  
                  // Sort slots by time and show all individual slots (matching real website behavior)
                  const sortedSlots = [...slots].sort((a, b) => a.time.localeCompare(b.time));
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
              <div class="border-t pt-1.5 sm:pt-2">
                <div class="flex items-center mb-1 flex-wrap">
                  <p class="font-semibold text-xs sm:text-sm">${courtName}</p>
                  ${courtTypeBadge}
                </div>
                <div class="flex flex-wrap gap-1">
                  ${slotButtons}
                </div>
              </div>
            `;
                }
              )
              .join("")}
          </div>
        `;
      } else {
        popupContent.innerHTML = `
          <h3 class="font-bold text-sm sm:text-lg mb-1">${location.name}</h3>
          ${location.address ? `<p class="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">${location.address}</p>` : ""}
          <div class="mt-2 sm:mt-3">
            <p class="text-xs sm:text-sm text-red-600 font-semibold">No courts available for this date</p>
          </div>
        `;
      }

      // Get initial popup width based on current zoom
      const initialZoom = map.getZoom();
      const initialMaxWidth = getPopupMaxWidth(initialZoom);

      const marker = L.marker([location.lat, location.lng], { icon: markerIcon })
        .addTo(map)
        .bindPopup(popupContent, { 
          maxWidth: initialMaxWidth,
          className: "leaflet-popup-zoom-responsive"
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
