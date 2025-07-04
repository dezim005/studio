
"use client";

import * as React from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ParkingSpotCard } from "@/components/parking/parking-spot-card";
import type { ParkingSpot, Reservation } from "@/types";
import { getParkingSpots, deleteParkingSpot } from "@/lib/parking-spot-service"; 
import { getAllReservations } from "@/lib/reservation-service"; 
import { PlusCircle, ParkingSquare, LayoutDashboard, CalendarCheck, Loader2, Building, Users, Bookmark, History, UserCheck, Trash2 } from "lucide-react"; 
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
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
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

export default function MySpotsPage() {
  const { isAuthenticated, user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const { isMobile, state: sidebarState } = useSidebar();
  const { toast } = useToast();

  const [allSpots, setAllSpots] = React.useState<ParkingSpot[]>([]);
  const [allReservations, setAllReservations] = React.useState<Reservation[]>([]);
  const [isLoadingData, setIsLoadingData] = React.useState(true);

  const [spotToDelete, setSpotToDelete] = React.useState<ParkingSpot | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isDeletingSpot, setIsDeletingSpot] = React.useState(false);

  React.useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isAuthLoading, router]);

  const fetchData = React.useCallback(() => {
    if (isAuthenticated) {
      setIsLoadingData(true);
      const spotsFromService = getParkingSpots();
      setAllSpots(spotsFromService);
      const reservationsFromService = getAllReservations();
      setAllReservations(reservationsFromService);
      setIsLoadingData(false);
    }
  }, [isAuthenticated]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenDeleteDialog = (spot: ParkingSpot) => {
    setSpotToDelete(spot);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDeleteSpot = async () => {
    if (!spotToDelete || !user) return;
    setIsDeletingSpot(true);
    
    const result = await deleteParkingSpot(spotToDelete.id, user.id, user.role);

    if (result.success) {
      toast({
        title: "Vaga Excluída",
        description: result.message,
      });
      fetchData(); // Re-fetch para atualizar a lista
    } else {
      toast({
        title: "Falha ao Excluir Vaga",
        description: result.message,
        variant: "destructive",
      });
    }
    setIsDeletingSpot(false);
    setIsDeleteDialogOpen(false);
    setSpotToDelete(null);
  };


  if (isAuthLoading || !isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const spotsToDisplay = user.role === 'manager'
    ? allSpots
    : allSpots.filter(spot => spot.ownerId === user.id);

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
                <SidebarMenuButton isActive tooltip="Minhas Vagas">
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
          <h1 className="text-xl font-semibold md:text-2xl">
            {user.role === 'manager' ? "Todas as Vagas Cadastradas" : "Minhas Vagas de Estacionamento"}
          </h1>
          <div className="ml-auto flex items-center gap-4">
            <Link href="/my-spots/register" passHref legacyBehavior>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Cadastrar Nova Vaga
              </Button>
            </Link>
            <UserNav />
          </div>
        </header>

        <main className="flex-1">
          <div className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-2xl">
                  {user.role === 'manager' ? "Gerenciar Vagas do Condomínio" : "Gerencie Suas Vagas"}
                </CardTitle>
                <CardDescription>
                  {user.role === 'manager'
                    ? "Visualize e gerencie todas as vagas de estacionamento cadastradas no sistema."
                    : "Visualize, edite a disponibilidade, gerencie e exclua suas vagas de estacionamento cadastradas."
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingData ? (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : spotsToDisplay.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {spotsToDisplay.map((spot) => {
                      const reservationsForThisSpot = allReservations.filter(res => res.spotId === spot.id);
                      return (
                        <ParkingSpotCard 
                          key={spot.id} 
                          spot={spot} 
                          reservationsForSpot={reservationsForThisSpot}
                          showActions 
                          onDeleteSpotClick={handleOpenDeleteDialog}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <ParkingSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">
                      {user.role === 'manager'
                        ? "Nenhuma vaga cadastrada no sistema ainda."
                        : "Você ainda não cadastrou nenhuma vaga."}
                    </p>
                    <Link href="/my-spots/register" passHref legacyBehavior>
                      <Button className="mt-4">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {user.role === 'manager' ? "Cadastrar Primeira Vaga" : "Cadastrar Sua Primeira Vaga"}
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

      {spotToDelete && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão da Vaga</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir a vaga{" "}
                <strong>{spotToDelete.number} ({spotToDelete.location})</strong>?
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setIsDeleteDialogOpen(false); setSpotToDelete(null);}} disabled={isDeletingSpot}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDeleteSpot}
                disabled={isDeletingSpot}
                className={buttonVariants({ variant: "destructive" })}
              >
                {isDeletingSpot && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar Exclusão
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
