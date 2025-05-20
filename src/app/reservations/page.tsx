
"use client";

import * as React from "react";
import Link from "next/link";
import { AvailableSpotsList, type ReservationDetails } from "@/components/parking/available-spots-list";
import { mockParkingSpots } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { UserNav } from "@/components/layout/user-nav";
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
import { LayoutDashboard, ParkingSquare, CalendarCheck } from "lucide-react";

export default function ReservationsPage() {
  const { toast } = useToast();
  const { isMobile } = useSidebar();

  const handleReserveSpot = (spotId: string, details: ReservationDetails) => {
    console.log("Reserving spot:", spotId, "Details:", details);
    // Simulate API call for reservation
    toast({
      title: "Reservation Requested",
      description: `Request to reserve spot ${spotId} from ${details.dateRange.from?.toLocaleDateString()} to ${details.dateRange.to?.toLocaleDateString()} has been submitted.`,
      variant: "default"
    });
    // In a real app, you might redirect to a confirmation page or update UI
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
                <SidebarMenuButton tooltip="Dashboard">
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
                <SidebarMenuButton isActive tooltip="Reserve a Spot">
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
          <h1 className="text-xl font-semibold md:text-2xl">Reserve a Parking Spot</h1>
          <div className="ml-auto">
            <UserNav />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-2xl">Find and Reserve Your Spot</CardTitle>
              <CardDescription>
                Browse available parking spots, filter by your preferences, and make a reservation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AvailableSpotsList spots={mockParkingSpots} onReserveSpot={handleReserveSpot} />
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

