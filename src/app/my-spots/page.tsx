
"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ParkingSpotCard } from "@/components/parking/parking-spot-card";
import type { ParkingSpot } from "@/types";
import { mockParkingSpots } from "@/lib/mock-data"; 
import { PlusCircle, ParkingSquare, LayoutDashboard, CalendarCheck, Loader2 } from "lucide-react";
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
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

export default function MySpotsPage() {
  const { isAuthenticated, user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const { isMobile } = useSidebar();

  React.useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isAuthLoading, router]);

  if (isAuthLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Filter spots owned by the current user
  const mySpots = user ? mockParkingSpots.filter(spot => spot.ownerId === user.id) : [];

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
          <h1 className="text-xl font-semibold md:text-2xl">My Parking Spots</h1>
          <div className="ml-auto flex items-center gap-4">
            <Link href="/my-spots/register" passHref legacyBehavior>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Register New Spot
              </Button>
            </Link>
            <UserNav />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-2xl">Manage Your Spots</CardTitle>
              <CardDescription>View, edit availability, and manage your registered parking spots.</CardDescription>
            </CardHeader>
            <CardContent>
              {mySpots.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mySpots.map((spot) => (
                    <ParkingSpotCard key={spot.id} spot={spot} showActions />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                   <ParkingSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">You haven't registered any spots yet.</p>
                  <Link href="/my-spots/register" passHref legacyBehavior>
                    <Button className="mt-4">
                      <PlusCircle className="mr-2 h-4 w-4" /> Register Your First Spot
                    </Button>
                  </Link>
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
