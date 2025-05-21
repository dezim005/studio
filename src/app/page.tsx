
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
import type { ParkingSpot } from "@/types";
import { getParkingSpots } from "@/lib/parking-spot-service"; // Atualizado
import { LayoutDashboard, ParkingSquare, CalendarCheck, Search, Filter, List, Map, Loader2, Building, Users } from "lucide-react";
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

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const [spots, setSpots] = React.useState<ParkingSpot[]>([]);
  const [isLoadingSpots, setIsLoadingSpots] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterType, setFilterType] = React.useState<string>("all");
  const [filterAvailability, setFilterAvailability] = React.useState<string>("all");
  const [viewMode, setViewMode] = React.useState<"list" | "map">("list");

  const { isMobile } = useSidebar();

  React.useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isAuthLoading, router]);

  React.useEffect(() => {
    if (isAuthenticated) {
      setIsLoadingSpots(true);
      const spotsFromService = getParkingSpots();
      setSpots(spotsFromService);
      setIsLoadingSpots(false);
      // Removido o setInterval que atualizava a disponibilidade aleatoriamente
      // para evitar conflitos com dados reais.
      // Uma atualização em tempo real mais robusta seria necessária (ex: WebSockets ou polling).
    }
  }, [isAuthenticated]);

  if (isAuthLoading || !isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredSpots = spots.filter(spot => {
    const matchesSearch = spot.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          spot.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || spot.type === filterType;
    const matchesAvailability = filterAvailability === 'all' ||
                                (filterAvailability === 'available' && spot.isAvailable) ||
                                (filterAvailability === 'occupied' && !spot.isAvailable);
    return matchesSearch && matchesType && matchesAvailability;
  });

  const handleReserveSpot = (spotId: string) => {
    alert(`Reservando vaga ${spotId}. Redirecionando para a página de reserva...`);
    // router.push(`/reservations/${spotId}`); // Exemplo de redirecionamento
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
          <h1 className="text-xl font-semibold md:text-2xl">Painel de Estacionamento</h1>
          <div className="ml-auto flex items-center gap-4">
            <UserNav />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-2xl">Disponibilidade de Vagas</CardTitle>
              <CardDescription>Veja as vagas de estacionamento atualmente disponíveis e ocupadas.</CardDescription>
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
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="available">Disponível</SelectItem>
                    <SelectItem value="occupied">Ocupada</SelectItem>
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

              {isLoadingSpots ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredSpots.length > 0 ? (
                 viewMode === 'list' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSpots.map((spot) => (
                      <ParkingSpotCard key={spot.id} spot={spot} showActions onReserve={handleReserveSpot} />
                    ))}
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
        </main>
        <footer className="border-t p-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Vaga Livre. Todos os direitos reservados.
        </footer>
      </SidebarInset>
    </div>
  );
}
