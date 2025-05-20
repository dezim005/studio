
"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { SpotAvailabilityCalendar } from "@/components/parking/spot-availability-calendar";
import { getSpotById } from "@/lib/mock-data"; // Using mock data
import type { ParkingSpot } from "@/types";
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
import { LayoutDashboard, ParkingSquare, CalendarCheck, ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";


export default function ManageSpotAvailabilityPage() {
  const params = useParams();
  const spotId = params.spotId as string;
  const [spot, setSpot] = React.useState<ParkingSpot | null | undefined>(undefined); // undefined for loading state
  const { isMobile } = useSidebar();

  React.useEffect(() => {
    if (spotId) {
      const foundSpot = getSpotById(spotId);
      // Simulate API delay
      setTimeout(() => setSpot(foundSpot || null), 500);
    }
  }, [spotId]);

  if (spot === undefined) {
    return (
       <div className="flex min-h-screen w-full">
         <Sidebar collapsible="icon" variant="sidebar" className="border-r">
          <SidebarHeader className="p-4">
            <div className="flex items-center justify-between"> <Logo /> {!isMobile && <SidebarTrigger />} </div>
          </SidebarHeader>
          <SidebarContent> <SidebarMenu> {/* Skeleton Nav */} </SidebarMenu> </SidebarContent>
        </Sidebar>
        <SidebarInset className="flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
             {isMobile && <SidebarTrigger />}
             <Skeleton className="h-8 w-8 rounded-md" />
             <Skeleton className="h-6 w-48 rounded-md" />
             <div className="ml-auto"> <UserNav /></div>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <Skeleton className="h-96 w-full max-w-4xl mx-auto rounded-xl" />
          </main>
        </SidebarInset>
      </div>
    );
  }
  
  if (spot === null) {
     return (
      <div className="flex min-h-screen w-full items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold">Spot Not Found</h1>
          <p className="text-muted-foreground mb-6">The parking spot you are looking for does not exist or you do not have permission to view it.</p>
          <Link href="/my-spots" passHref legacyBehavior>
            <Button><ArrowLeft className="mr-2 h-4 w-4"/>Go Back to My Spots</Button>
          </Link>
        </div>
      </div>
    );
  }


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
                <SidebarMenuButton isActive tooltip="My Spots">
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
          <Link href="/my-spots" passHref legacyBehavior>
             <Button variant="outline" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to My Spots</span>
              </Button>
          </Link>
          <h1 className="text-xl font-semibold md:text-2xl truncate">Manage Availability: Spot {spot.number}</h1>
          <div className="ml-auto">
            <UserNav />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <SpotAvailabilityCalendar spot={spot} />
        </main>
        <footer className="border-t p-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Vaga Livre. All rights reserved.
        </footer>
      </SidebarInset>
    </div>
  );
}
