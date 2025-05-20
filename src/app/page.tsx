
"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ParkingSpotCard } from "@/components/parking/parking-spot-card";
import { Logo } from "@/components/logo";
import { UserNav } from "@/components/layout/user-nav";
import type { ParkingSpot } from "@/types";
import { mockParkingSpots } from "@/lib/mock-data";
import { LayoutDashboard, ParkingSquare, CalendarCheck, PlusCircle, Search, Filter, List, Map } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";


export default function DashboardPage() {
  const [spots, setSpots] = React.useState<ParkingSpot[]>(mockParkingSpots);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterType, setFilterType] = React.useState<string>("all");
  const [filterAvailability, setFilterAvailability] = React.useState<string>("all");
  const [viewMode, setViewMode] = React.useState<"list" | "map">("list"); // Map view is conceptual

  const { isMobile } = useSidebar();

  // Simulate real-time updates
  React.useEffect(() => {
    const interval = setInterval(() => {
      setSpots((prevSpots) =>
        prevSpots.map((spot) =>
          Math.random() > 0.9
            ? { ...spot, isAvailable: !spot.isAvailable }
            : spot
        )
      );
    }, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const filteredSpots = spots.filter(spot => {
    const matchesSearch = spot.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          spot.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || spot.type === filterType;
    const matchesAvailability = filterAvailability === 'all' ||
                                (filterAvailability === 'available' && spot.isAvailable) ||
                                (filterAvailability === 'occupied' && !spot.isAvailable);
    return matchesSearch && matchesType && matchesAvailability;
  });

  const handleReserveSpot = (spotId: string) => {
    // Placeholder for reservation logic
    alert(`Reserving spot ${spotId}. Redirecting to reservation page...`);
    // router.push(`/reservations/new?spotId=${spotId}`);
  };

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar collapsible="icon" variant="sidebar" className="border-r">
        <SidebarHeader className="p-4">
          <div className="flex items-center justify-between">
            <Logo />
            {!isMobile && <SidebarTrigger />}
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/" legacyBehavior passHref>
                <SidebarMenuButton isActive tooltip="Dashboard">
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/my-spots" legacyBehavior passHref>
                <SidebarMenuButton tooltip="My Spots">
                  <ParkingSquare />
                  <span>My Spots</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/reservations" legacyBehavior passHref>
                <SidebarMenuButton tooltip="Reserve a Spot">
                  <CalendarCheck />
                  <span>Reserve a Spot</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>

      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
          {isMobile && <SidebarTrigger />}
          <h1 className="text-xl font-semibold md:text-2xl">Parking Dashboard</h1>
          <div className="ml-auto flex items-center gap-4">
            <UserNav />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-2xl">Real-time Parking Availability</CardTitle>
              <CardDescription>View currently available and occupied parking spots. Updates dynamically.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="relative">
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
                <Select value={filterAvailability} onValueChange={setFilterAvailability}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end items-center mb-4 gap-2">
                <span className="text-sm text-muted-foreground">View:</span>
                <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('list')}>
                  <List className="mr-2 h-4 w-4"/> List
                </Button>
                <Button variant={viewMode === 'map' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('map')} disabled> {/* Map view disabled for now */}
                  <Map className="mr-2 h-4 w-4"/> Map (Soon)
                </Button>
              </div>

              <Separator className="my-4"/>

              {filteredSpots.length > 0 ? (
                 viewMode === 'list' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSpots.map((spot) => (
                      <ParkingSpotCard key={spot.id} spot={spot} showActions onReserve={handleReserveSpot} />
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 border rounded-md bg-muted/50">
                    <p className="text-muted-foreground">Map view coming soon!</p>
                  </div>
                )
              ) : (
                <div className="text-center py-10">
                  <ParkingSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">No parking spots match your criteria.</p>
                  <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
        <footer className="border-t p-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Vaga Livre. All rights reserved.
        </footer>
      </SidebarInset>
    </div>
  );
}
