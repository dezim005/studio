
"use client";

import * as React from "react";
import Link from "next/link";
import { AvailableSpotsList, type ReservationDetails } from "@/components/parking/available-spots-list";
import { getParkingSpots } from "@/lib/parking-spot-service"; 
import type { ParkingSpot } from "@/types"; 
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
  SidebarGroup,
  SidebarGroupLabel
} from "@/components/ui/sidebar";
import { LayoutDashboard, ParkingSquare, CalendarCheck, Loader2, Building, Users } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
// Importar getAllReservations para passar para AvailableSpotsList se necessário,
// mas AvailableSpotsList já está buscando internamente.

export default function ReservationsPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  // const { toast } = useToast(); // toast é usado dentro de AvailableSpotsList
  const { isMobile } = useSidebar();
  const [spots, setSpots] = React.useState<ParkingSpot[]>([]);
  const [isLoadingSpots, setIsLoadingSpots] = React.useState(true);

  React.useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isAuthLoading, router]);

  React.useEffect(() => {
    if (isAuthenticated) {
      setIsLoadingSpots(true);
      const spotsFromService = getParkingSpots(); // Busca inicial
      setSpots(spotsFromService);
      setIsLoadingSpots(false);
    }
  }, [isAuthenticated]);

  if (isAuthLoading || !isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // A lógica de reserva agora está encapsulada em AvailableSpotsList e reservation-service
  // const handleReserveSpot = (spotId: string, details: ReservationDetails) => {
  //   console.log("Reservando vaga:", spotId, "Detalhes:", details);
  //   // ... lógica movida ...
  // };

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
                <SidebarMenuButton tooltip="Painel">
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
              <Link href="/reservations" legacyBehavior passHref>
                <SidebarMenuButton isActive tooltip="Reservar Vaga">
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
          <h1 className="text-xl font-semibold md:text-2xl">Reservar Vaga de Estacionamento</h1>
          <div className="ml-auto">
            <UserNav />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-2xl">Encontre e Reserve Sua Vaga</CardTitle>
              <CardDescription>
                Navegue pelas vagas disponíveis, filtre por suas preferências e faça uma reserva.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSpots ? (
                 <div className="flex justify-center items-center py-10">
                   <Loader2 className="h-8 w-8 animate-spin text-primary" />
                 </div>
              ) : (
                // Passar os spots buscados para AvailableSpotsList.
                // AvailableSpotsList cuidará de sua própria lógica de busca de reservas.
                <AvailableSpotsList spots={spots} />
              )}
            </CardContent>
          </Card>
        </main>
        <footer className="border-t p-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Vaga Livre. Todos os direitos reservados.
        </footer>
      </SidebarInset>
    </div>
  );
}

