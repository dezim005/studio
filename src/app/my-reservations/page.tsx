
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
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { UserNav } from "@/components/layout/user-nav";
import type { Reservation, ParkingSpot } from "@/types";
import { getAllReservations, cancelReservation } from "@/lib/reservation-service";
import { getSpotById } from "@/lib/parking-spot-service";
import { LayoutDashboard, ParkingSquare, CalendarCheck, Bookmark, Loader2, AlertTriangle, Building, Users, History, UserCheck, Trash2, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserReservationDetails extends Reservation {
  spotDetails?: ParkingSpot;
}

export default function MyReservationsPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const { isMobile, state: sidebarState } = useSidebar();
  const { toast } = useToast();

  const [userReservations, setUserReservations] = React.useState<UserReservationDetails[]>([]);
  const [isLoadingReservations, setIsLoadingReservations] = React.useState(true);
  
  const [reservationToCancel, setReservationToCancel] = React.useState<UserReservationDetails | null>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = React.useState(false);
  const [isCancelling, setIsCancelling] = React.useState(false);

  React.useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isAuthLoading, router]);

  const fetchUserReservations = React.useCallback(() => {
    if (isAuthenticated && user) {
      setIsLoadingReservations(true);
      const allRes = getAllReservations();
      const currentUserReservations = allRes.filter(res => res.userId === user.id);
      
      const detailedReservations: UserReservationDetails[] = currentUserReservations.map(res => {
        const spot = getSpotById(res.spotId);
        return { ...res, spotDetails: spot };
      }).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()); 

      setUserReservations(detailedReservations);
      setIsLoadingReservations(false);
    }
  }, [isAuthenticated, user]);

  React.useEffect(() => {
    fetchUserReservations();
  }, [fetchUserReservations]);


  const handleOpenCancelDialog = (reservation: UserReservationDetails) => {
    setReservationToCancel(reservation);
    setIsCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!reservationToCancel || !user) return;
    setIsCancelling(true);
    
    const result = await cancelReservation(reservationToCancel.id, user.id);

    if (result.success) {
      toast({
        title: "Reserva Cancelada",
        description: result.message,
      });
      fetchUserReservations(); // Re-fetch para atualizar a lista
    } else {
      toast({
        title: "Falha ao Cancelar",
        description: result.message,
        variant: "destructive",
      });
    }
    setIsCancelling(false);
    setIsCancelDialogOpen(false);
    setReservationToCancel(null);
  };
  
  const canCancelReservation = (reservationEndTime: Date): boolean => {
    return new Date() < new Date(reservationEndTime);
  };


  if (isAuthLoading || !isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar collapsible="icon" variant="sidebar" className="shadow-lg">
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
                <SidebarMenuItem>
                  <Link href="/admin/rental-history" legacyBehavior passHref>
                    <SidebarMenuButton tooltip="Histórico de Aluguéis">
                      <History />
                      <span>Histórico de Aluguéis</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link href="/admin/approvals" legacyBehavior passHref>
                    <SidebarMenuButton tooltip="Aprovações de Cadastro">
                      <UserCheck />
                      <span>Aprovações</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              </SidebarGroup>
            )}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>

      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 bg-white shadow-lg px-4 md:px-6">
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
                      <Card key={res.id} className="shadow-lg flex flex-col justify-between">
                        <div>
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
                        </div>
                        <CardFooter>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            className="w-full"
                            onClick={() => handleOpenCancelDialog(res)}
                            disabled={!canCancelReservation(res.endTime) || isCancelling}
                          >
                            {isCancelling && reservationToCancel?.id === res.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4" />}
                            {isCancelling && reservationToCancel?.id === res.id ? "Cancelando..." : "Cancelar Reserva"}
                          </Button>
                        </CardFooter>
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

      {reservationToCancel && (
        <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Cancelamento</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja cancelar a reserva para a vaga{" "}
                <strong>{reservationToCancel.spotDetails?.number || "Desconhecida"}</strong>{" "}
                no período de{" "}
                <strong>{format(new Date(reservationToCancel.startTime), "dd/MM/yyyy", { locale: ptBR })}</strong> a {" "}
                <strong>{format(new Date(reservationToCancel.endTime), "dd/MM/yyyy", { locale: ptBR })}</strong>?
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setIsCancelDialogOpen(false); setReservationToCancel(null);}} disabled={isCancelling}>
                Voltar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className={buttonVariants({ variant: "destructive" })}
              >
                {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar Cancelamento
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
