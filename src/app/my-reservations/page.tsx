
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { UserNav } from "@/components/layout/user-nav";
import type { Reservation, ParkingSpot } from "@/types";
import { getAllReservations } from "@/lib/reservation-service";
import { getSpotById } from "@/lib/parking-spot-service";
import { LayoutDashboard, ParkingSquare, CalendarCheck, Bookmark, Loader2, AlertTriangle, Building, Users } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UserReservationDetails extends Reservation {
  spotDetails?: ParkingSpot;
}

export default function MyReservationsPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const { isMobile } = useSidebar();

  const [userReservations, setUserReservations] = React.useState<UserReservationDetails[]>([]);
  const [isLoadingReservations, setIsLoadingReservations] = React.useState(true);

  React.useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isAuthLoading, router]);

  React.useEffect(() => {
    if (isAuthenticated && user) {
      setIsLoadingReservations(true);
      const allRes = getAllReservations();
      const currentUserReservations = allRes.filter(res => res.userId === user.id);
      
      const detailedReservations: UserReservationDetails[] = currentUserReservations.map(res => {
        const spot = getSpotById(res.spotId);
        return { ...res, spotDetails: spot };
      }).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()); // Sort by newest first

      setUserReservations(detailedReservations);
      setIsLoadingReservations(false);
    }
  }, [isAuthenticated, user]);

  if (isAuthLoading || !isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
              <Link href="/my-reservations" legacyBehavior passHref>
                <SidebarMenuButton isActive tooltip="Minhas Reservas">
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
          <h1 className="text-xl font-semibold md:text-2xl">Minhas Reservas</h1>
          <div className="ml-auto">
            <UserNav />
          </div>
        </header>

        <main className="flex-1">
          <div className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center">
                  <Bookmark className="mr-3 h-7 w-7 text-primary" />
                  Histórico de Reservas
                </CardTitle>
                <CardDescription>
                  Veja todas as suas reservas de vagas de estacionamento.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingReservations ? (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : userReservations.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userReservations.map((res) => (
                      <Card key={res.id} className="shadow-lg">
                        <CardHeader>
                          <CardTitle>
                            Vaga: {res.spotDetails?.number || "N/A"}
                          </CardTitle>
                          <CardDescription>
                            Local: {res.spotDetails?.location || "Não informado"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-1 text-sm">
                          <p><strong>Período:</strong></p>
                          <p>
                            De: {format(new Date(res.startTime), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                          <p>
                            Até: {format(new Date(res.endTime), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                          {res.spotDetails?.ownerName && (
                              <p className="text-xs text-muted-foreground pt-2">
                                  Vaga de: {res.spotDetails.ownerName}
                              </p>
                          )}
                        </CardContent>
                        {/* <CardFooter>
                          <Button variant="outline" size="sm" disabled>Cancelar Reserva (Em breve)</Button>
                        </CardFooter> */}
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">Você ainda não fez nenhuma reserva.</p>
                    <Link href="/reservations" passHref legacyBehavior>
                      <Button className="mt-4">
                        <CalendarCheck className="mr-2 h-4 w-4" />
                        Reservar uma Vaga
                      </Button>
                    </Link>
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
