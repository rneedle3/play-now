"use client";

import { useState } from "react";
import DateSelector from "@/components/DateSelector";
import CourtMap from "@/components/CourtMap";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import Image from "next/image";

export type SportFilter = "both" | "tennis" | "pickleball";

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [sportFilter, setSportFilter] = useState<SportFilter>("both");

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200/60 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-24 h-24 flex items-center justify-center">
              <Image
                src="/play_now.svg"
                alt="Play Now"
                width={100}
                height={100}
                className="w-full h-full"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Play Now
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                San Francisco Tennis & Pickleball Courts Availability
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Date Selector */}
        <Card className="mb-6 border border-gray-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle>Select Date</CardTitle>
            </div>
            <CardDescription>
              Showing courts for: <span className="font-semibold text-foreground">{format(selectedDate, "EEEE, MMMM d, yyyy")}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DateSelector
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
          </CardContent>
        </Card>

        {/* Sport Type Selector */}
        <Card className="mb-6 border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle>Filter by Sport</CardTitle>
            <CardDescription>
              Select which sports to display
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <button
                onClick={() => setSportFilter("both")}
                className={`
                  flex-1 px-4 py-3 rounded-lg border-2 transition-all font-medium
                  ${sportFilter === "both"
                    ? "border-primary bg-primary text-primary-foreground shadow-md"
                    : "border-border bg-card text-foreground hover:border-primary/50 hover:shadow"
                  }
                `}
              >
                Both
              </button>
              <button
                onClick={() => setSportFilter("tennis")}
                className={`
                  flex-1 px-4 py-3 rounded-lg border-2 transition-all font-medium
                  ${sportFilter === "tennis"
                    ? "border-blue-500 bg-blue-500 text-white shadow-md"
                    : "border-border bg-card text-foreground hover:border-blue-500/50 hover:shadow"
                  }
                `}
              >
                Tennis
              </button>
              <button
                onClick={() => setSportFilter("pickleball")}
                className={`
                  flex-1 px-4 py-3 rounded-lg border-2 transition-all font-medium
                  ${sportFilter === "pickleball"
                    ? "border-purple-500 bg-purple-500 text-white shadow-md"
                    : "border-border bg-card text-foreground hover:border-purple-500/50 hover:shadow"
                  }
                `}
              >
                Pickleball
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Court Map */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle>Available Courts</CardTitle>
            <CardDescription>
              Click on markers to see court availability and details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CourtMap selectedDate={selectedDate} sportFilter={sportFilter} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
