
"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ParkingSpotCard } from "@/components/parking/parking-spot-card";
import type { ParkingSpot } from "@/types";
import { getParkingSpots } from "@/lib/parking-spot-service"; // Atualizado
import { PlusCircle, ParkingSquare, LayoutDashboard, CalendarCheck, Loader2, Building, Users } from "lucide-react";
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

export default function MySpotsPage() {
  const { isAuthenticated, user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const { isMobile } = useSidebar();
  const [allSpots, setAllSpots] = React.useState<ParkingSpot[]>([]);
  const [isLoadingSpots, setIsLoadingSpots] = React.useState(true);

  React.useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isAuthLoading, router]);

  React.useEffect(() => {
    if (isAuthenticated) {
      setIsLoadingSpots(true);
      const spotsFromService = getParkingSpots();
      setAllSpots(spotsFromService);
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

  const spotsToDisplay = user.role === 'manager'
    ? allSpots
    : allSpots.filter(spot => spot.ownerId === user.id);

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
                <SidebarMenuButton isActive tooltip="Minhas Vagas">
                  <ParkingSquare />
                  <span>Minhas Vagas</span>
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

        <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-2xl">
                {user.role === 'manager' ? "Gerenciar Vagas do Condomínio" : "Gerencie Suas Vagas"}
              </CardTitle>
              <CardDescription>
                {user.role === 'manager'
                  ? "Visualize e gerencie todas as vagas de estacionamento cadastradas no sistema."
                  : "Visualize, edite a disponibilidade e gerencie suas vagas de estacionamento cadastradas."
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSpots ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : spotsToDisplay.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {spotsToDisplay.map((spot) => (
                    <ParkingSpotCard key={spot.id} spot={spot} showActions />
                  ))}
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
        </main>
        <footer className="border-t p-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Vaga Livre. Todos os direitos reservados.
        </footer>
      </SidebarInset>
    </div>
  );
}
