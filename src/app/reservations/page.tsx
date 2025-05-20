
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
import { LayoutDashboard, ParkingSquare, CalendarCheck, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

export default function ReservationsPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
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

  const handleReserveSpot = (spotId: string, details: ReservationDetails) => {
    console.log("Reservando vaga:", spotId, "Detalhes:", details);
    const fromDate = details.dateRange.from?.toLocaleDateString('pt-BR') || 'Data de início não selecionada';
    const toDate = details.dateRange.to?.toLocaleDateString('pt-BR') || fromDate;

    toast({
      title: "Reserva Solicitada",
      description: `Solicitação para reservar a vaga ${spotId} de ${fromDate} até ${toDate} foi enviada.`,
      variant: "default"
    });
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
              <AvailableSpotsList spots={mockParkingSpots} onReserveSpot={handleReserveSpot} />
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
