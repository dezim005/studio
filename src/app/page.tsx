
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
  SidebarGroup,
  SidebarGroupLabel
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ParkingSpotCard } from "@/components/parking/parking-spot-card";
import { Logo } from "@/components/logo";
import { UserNav } from "@/components/layout/user-nav";
import type { ParkingSpot, Reservation } from "@/types"; 
import { getParkingSpots } from "@/lib/parking-spot-service"; 
import { getAllReservations, isSpotFullyBooked } from "@/lib/reservation-service"; 
import { LayoutDashboard, ParkingSquare, CalendarCheck, Search, List, Map, Loader2, Building, Users, Bookmark } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { startOfDay, endOfDay } from "date-fns"; 
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const [spots, setSpots] = React.useState<ParkingSpot[]>([]);
  const [allReservations, setAllReservations] = React.useState<Reservation[]>([]); 
  const [isLoadingData, setIsLoadingData] = React.useState(true); 
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterType, setFilterType] = React.useState<string>("all");
  const [filterAvailability, setFilterAvailability] = React.useState<string>("all"); 
  const [viewMode, setViewMode] = React.useState<"list" | "map">("list");

  const { isMobile, state: sidebarState } = useSidebar();

  React.useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isAuthLoading, router]);

  React.useEffect(() => {
    if (isAuthenticated) {
      setIsLoadingData(true);
      const spotsFromService = getParkingSpots();
      setSpots(spotsFromService);
      const reservationsFromService = getAllReservations(); 
      setAllReservations(reservationsFromService);
      setIsLoadingData(false);
    }
  }, [isAuthenticated]);

  if (isAuthLoading || !isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isSpotOccupiedNow = (spot: ParkingSpot, spotSpecificReservations: Reservation[]): boolean => {
    const now = new Date();
    
    const hasAvailabilityToday = spot.availability?.some(slot => {
        const slotStart = startOfDay(new Date(slot.startTime));
        const slotEnd = endOfDay(new Date(slot.endTime));
        return now >= slotStart && now <= slotEnd;
    }) || false;

    if (spot.availability && spot.availability.length > 0 && !hasAvailabilityToday) {
        return true; 
    }
    
    return spotSpecificReservations.some(res => {
      const resStart = new Date(res.startTime);
      const resEnd = new Date(res.endTime);
      return resStart <= now && resEnd >= now;
    });
  };
  
  const filteredSpots = spots.filter(spot => {
    const matchesSearch = spot.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          spot.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || spot.type === filterType;
    
    const spotSpecificReservations = allReservations.filter(r => r.spotId === spot.id);

    let matchesAvailabilityFilter = true;
    if (filterAvailability !== 'all') {
        const isOccupied = isSpotOccupiedNow(spot, spotSpecificReservations);
        // For the dashboard filter, "available" means the owner set it as generally available,
        // it has some configuration, and it's not currently booked by a reservation.
        if (filterAvailability === 'available') {
            matchesAvailabilityFilter = spot.isAvailable && 
                                        (spot.availability && spot.availability.length > 0) && 
                                        !isOccupied;
        } else if (filterAvailability === 'occupied') {
            // Occupied if owner marked as unavailable OR it's not configured for availability
            // OR it is currently occupied by a reservation.
            matchesAvailabilityFilter = !spot.isAvailable || 
                                        !(spot.availability && spot.availability.length > 0) || 
                                        isOccupied;
        }
    }
    // Dashboard still shows spots that are generally available by owner.
    // The card itself will show more detailed status like "fully_booked".
    return spot.isAvailable && matchesSearch && matchesType && matchesAvailabilityFilter;
  });


  return (
    <div className="flex min-h-screen w-full">
      <Sidebar collapsible="icon" variant="sidebar" className="border-r">
        <SidebarHeader className={cn(
          "flex items-center", 
          !isMobile && sidebarState === 'collapsed' ? "p-2 justify-center" : "p-4 justify-between",
          isMobile && "p-4 justify-between"
        )}>
          {(!isMobile && sidebarState === 'collapsed') ? (
            <SidebarTrigger />
          ) : (
            <>
              <Logo />
              {!isMobile && <SidebarTrigger />}
            </>
          )}
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/" legacyBehavior passHref>
                <SidebarMenuButton isActive tooltip="Painel">
                  <LayoutDashboard />
                  <span>Painel</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/my-spots" legacyBehavior passHref>
                <SidebarMenuButton tooltip="Minhas Vagas">
                  <ParkingSquare />
                  <span>Minhas Vagas</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <Link href="/my-reservations" legacyBehavior passHref>
                  <SidebarMenuButton tooltip="Minhas Reservas">
                    <Bookmark />
                    <span>Minhas Reservas</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/reservations" legacyBehavior passHref>
                <SidebarMenuButton tooltip="Reservar Vaga">
                  <CalendarCheck />
                  <span>Reservar Vaga</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            {user?.role === 'manager' && (
              <SidebarGroup>
                <SidebarGroupLabel className="pt-4">Administração</SidebarGroupLabel>
                <SidebarMenuItem>
                  <Link href="/admin/condominiums/register" legacyBehavior passHref>
                    <SidebarMenuButton tooltip="Cadastrar Condomínio">
                      <Building />
                      <span>Cadastrar Condomínio</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <Link href="/admin/users" legacyBehavior passHref>
                    <SidebarMenuButton tooltip="Gerenciar Usuários">
                      <Users />
                      <span>Gerenciar Usuários</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              </SidebarGroup>
            )}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>

      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
          {isMobile && <SidebarTrigger />}
          <h1 className="text-xl font-semibold md:text-2xl">Painel de Estacionamento</h1>
          <div className="ml-auto flex items-center gap-4">
            <UserNav />
          </div>
        </header>

        <main className="flex-1">
          <div className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-2xl">Disponibilidade de Vagas</CardTitle>
                <CardDescription>Veja as vagas de estacionamento e seu status atual. Para reservar, vá para "Reservar Vaga".</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar por número da vaga ou localização..."
                      className="pl-8 w-full"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Filtrar por tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Tipos</SelectItem>
                      <SelectItem value="compact">Compacto</SelectItem>
                      <SelectItem value="standard">Padrão</SelectItem>
                      <SelectItem value="suv">SUV</SelectItem>
                      <SelectItem value="motorcycle">Moto</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterAvailability} onValueChange={setFilterAvailability}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Filtrar por disponibilidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status (Agora)</SelectItem>
                      <SelectItem value="available">Disponível (Agora)</SelectItem>
                      <SelectItem value="occupied">Ocupada (Agora)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end items-center mb-4 gap-2">
                  <span className="text-sm text-muted-foreground">Visualizar:</span>
                  <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('list')}>
                    <List className="mr-2 h-4 w-4"/> Lista
                  </Button>
                  <Button variant={viewMode === 'map' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('map')} disabled>
                    <Map className="mr-2 h-4 w-4"/> Mapa (Em breve)
                  </Button>
                </div>

                <Separator className="my-4"/>

                {isLoadingData ? (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredSpots.length > 0 ? (
                  viewMode === 'list' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredSpots.map((spot) => {
                        const reservationsForThisSpot = allReservations.filter(res => res.spotId === spot.id);
                        return (
                          <ParkingSpotCard 
                            key={spot.id} 
                            spot={spot} 
                            reservationsForSpot={reservationsForThisSpot}
                            showActions={false} 
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64 border rounded-md bg-muted/50">
                      <p className="text-muted-foreground">Visualização de mapa em breve!</p>
                    </div>
                  )
                ) : (
                  <div className="text-center py-10">
                    <ParkingSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">Nenhuma vaga de estacionamento corresponde aos seus critérios.</p>
                    <p className="text-sm text-muted-foreground">Tente ajustar sua busca ou filtros.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
        <footer className="border-t p-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Vaga Livre. Todos os direitos reservados.
        </footer>
      </SidebarInset>
    </div>
  );
}
