"use client";

import { useState } from "react";
import DateSelector from "@/components/DateSelector";
import CourtMap from "@/components/CourtMap";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Activity } from "lucide-react";

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Activity className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">
                Play Now
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <MapPin className="h-4 w-4 opacity-90" />
                <p className="text-blue-100 text-lg">
                  San Francisco Tennis & Pickleball Court Availability
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
              Tennis
            </Badge>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
              Pickleball
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Date Selector */}
        <Card className="mb-6 shadow-md">
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

        {/* Court Map */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Available Courts</CardTitle>
            <CardDescription>
              Click on markers to see court availability and details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CourtMap selectedDate={selectedDate} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
