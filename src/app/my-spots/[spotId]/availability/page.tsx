
"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { SpotAvailabilityCalendar } from "@/components/parking/spot-availability-calendar";
import { getSpotById } from "@/lib/mock-data";
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
  SidebarGroup,
  SidebarGroupLabel
} from "@/components/ui/sidebar";
import { LayoutDashboard, ParkingSquare, CalendarCheck, ArrowLeft, AlertTriangle, Loader2, Building, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";


export default function ManageSpotAvailabilityPage() {
  const { isAuthenticated, user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const spotId = params.spotId as string;
  const [spot, setSpot] = React.useState<ParkingSpot | null | undefined>(undefined);
  const { isMobile } = useSidebar();

  React.useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isAuthLoading, router]);

  React.useEffect(() => {
    if (isAuthenticated && user && spotId) {
      const foundSpot = getSpotById(spotId);
      if (foundSpot && user.role === 'resident' && foundSpot.ownerId !== user.id) {
        setSpot(null); // Resident cannot manage a spot they don't own
      } else {
        setTimeout(() => setSpot(foundSpot || null), 500); // Simulate loading
      }
    } else if (!isAuthenticated && !isAuthLoading) {
       setSpot(null); // Should not happen if auth guard works, but safety
    }
  }, [spotId, isAuthenticated, user, isAuthLoading]);

  if (isAuthLoading || !isAuthenticated || user === null || spot === undefined) {
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
          <h1 className="text-2xl font-bold">Vaga Não Encontrada</h1>
          <p className="text-muted-foreground mb-6">A vaga de estacionamento que você está procurando não existe ou você não tem permissão para visualizá-la.</p>
          <Link href="/my-spots" passHref legacyBehavior>
            <Button><ArrowLeft className="mr-2 h-4 w-4"/>Voltar para Minhas Vagas</Button>
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
                    <SidebarMenuButton tooltip="Gerenciar Usuários (Em breve)" disabled>
                      <Users />
                      <span>Gerenciar Usuários</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarGroup>
            )}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>

      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
          {isMobile && <SidebarTrigger />}
          <Link href="/my-spots" passHref legacyBehavior>
             <Button variant="outline" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Voltar para Minhas Vagas</span>
              </Button>
          </Link>
          <h1 className="text-xl font-semibold md:text-2xl truncate">Gerenciar Disponibilidade: Vaga {spot.number}</h1>
          <div className="ml-auto">
            <UserNav />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <SpotAvailabilityCalendar spot={spot} />
        </main>
        <footer className="border-t p-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Vaga Livre. Todos os direitos reservados.
        </footer>
      </SidebarInset>
    </div>
  );
}
