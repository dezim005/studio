
"use client";

import * as React from "react";
import type { ParkingSpot } from "@/types";
import { ParkingSpotCard } from "./parking-spot-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { DateRange } from "react-day-picker";
import { addDays, format } from "date-fns";
import { Search, ParkingSquare, CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface AvailableSpotsListProps {
  spots: ParkingSpot[];
  onReserveSpot: (spotId: string, details: ReservationDetails) => void;
}

export interface ReservationDetails {
  dateRange: DateRange;
  // Potentially add time slots here if needed
}

function DateRangePicker({
  className,
  date,
  onDateChange,
}: React.HTMLAttributes<HTMLDivElement> & { date: DateRange | undefined; onDateChange: (date: DateRange | undefined) => void }) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={onDateChange}
            numberOfMonths={2}
            disabled={(day) => day < new Date(new Date().setHours(0,0,0,0))}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}


export function AvailableSpotsList({ spots, onReserveSpot }: AvailableSpotsListProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterType, setFilterType] = React.useState<string>("all");
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 0), // Default to today
  });
  const { toast } = useToast();

  const availableSpots = spots.filter(spot => spot.isAvailable); // Only show initially available spots

  const filteredSpots = availableSpots.filter(spot => {
    const matchesSearch = spot.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          spot.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || spot.type === filterType;
    // Date filtering would be more complex, checking against spot's availability slots.
    // For this demo, we assume all 'isAvailable' spots match the selected dateRange if one is picked.
    const matchesDate = !!dateRange?.from; 
    return matchesSearch && matchesType && matchesDate;
  });

  const handleReserve = (spotId: string) => {
    if (!dateRange || !dateRange.from) {
      toast({
        title: "Select Date Range",
        description: "Please select a date range for your reservation.",
        variant: "destructive",
      });
      return;
    }
    onReserveSpot(spotId, { dateRange });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-1">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by spot number or location..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="compact">Compact</SelectItem>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="suv">SUV</SelectItem>
            <SelectItem value="motorcycle">Motorcycle</SelectItem>
          </SelectContent>
        </Select>
        <DateRangePicker date={dateRange} onDateChange={setDateRange} />
      </div>

      {filteredSpots.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpots.map((spot) => (
            <ParkingSpotCard key={spot.id} spot={spot} showActions onReserve={() => handleReserve(spot.id)} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 border rounded-md bg-card">
          <ParkingSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground">No available spots match your criteria.</p>
          <p className="text-sm text-muted-foreground">Try adjusting your search, filters, or selected date range.</p>
        </div>
      )}
    </div>
  );
}

