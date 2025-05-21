
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Logo } from "@/components/logo";
import { UserNav } from "@/components/layout/user-nav";
import type { Reservation, User, ParkingSpot } from "@/types";
import { getAllReservations } from "@/lib/reservation-service";
import { getUsers } from "@/lib/user-service";
import { getParkingSpots } from "@/lib/parking-spot-service";
import { LayoutDashboard, ParkingSquare, CalendarCheck, Building, Users as UsersIcon, ArrowLeft, Loader2, History, User as UserIconLucide, Calendar as CalendarIconLucide, Bookmark, FilterX } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { format, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

interface DetailedReservation extends Reservation {
  userName?: string;
  spotNumber?: string;
  spotLocation?: string;
}

export default function RentalHistoryPage() {
  const { user: currentUser, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const { isMobile, state: sidebarState } = useSidebar();

  const [allReservations, setAllReservations] = React.useState<Reservation[]>([]);
  const [allUsers, setAllUsers] = React.useState<User[]>([]);
  const [allSpots, setAllSpots] = React.useState<ParkingSpot[]>([]);
  const [isLoadingData, setIsLoadingData] = React.useState(true);

  const [selectedUserId, setSelectedUserId] = React.useState<string>("all");
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);

  React.useEffect(() => {
    if (!isAuthLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (currentUser?.role !== 'manager') {
        router.push("/"); // Redirect non-managers
      }
    }
  }, [isAuthenticated, isAuthLoading, currentUser, router]);

  React.useEffect(() => {
    if (isAuthenticated && currentUser?.role === 'manager') {
      setIsLoadingData(true);
      setAllReservations(getAllReservations());
      setAllUsers(getUsers());
      setAllSpots(getParkingSpots());
      setIsLoadingData(false);
    }
  }, [isAuthenticated, currentUser]);

  const detailedReservations = React.useMemo((): DetailedReservation[] => {
    return allReservations.map(res => {
      const user = allUsers.find(u => u.id === res.userId);
      const spot = allSpots.find(s => s.id === res.spotId);
      return {
        ...res,
        userName: user?.name || "Usuário Desconhecido",
        spotNumber: spot?.number || "Vaga Desconhecida",
        spotLocation: spot?.location || "Local Desconhecido",
      };
    }).sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()); // Sort by newest first
  }, [allReservations, allUsers, allSpots]);

  const filteredReservations = React.useMemo(() => {
    return detailedReservations.filter(res => {
      const matchesUser = selectedUserId === "all" || res.userId === selectedUserId;
      
      let matchesDate = true;
      if (dateRange?.from) {
        const resStartDate = startOfDay(new Date(res.startTime));
        const resEndDate = endOfDay(new Date(res.endTime));
        const filterStartDate = startOfDay(dateRange.from);
        const filterEndDate = dateRange.to ? endOfDay(dateRange.to) : filterStartDate;
        
        matchesDate = resStartDate <= filterEndDate && resEndDate >= filterStartDate;
      }
      return matchesUser && matchesDate;
    });
  }, [detailedReservations, selectedUserId, dateRange]);

  const handleClearFilters = () => {
    setSelectedUserId("all");
    setDateRange(undefined);
  };

  if (isAuthLoading || (!isAuthenticated && !isAuthLoading) || (isAuthenticated && currentUser?.role !== 'manager' && !isAuthLoading)) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
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
            {currentUser?.role === 'manager' && (
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
                      <UsersIcon />
                      <span>Gerenciar Usuários</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link href="/admin/rental-history" legacyBehavior passHref>
                    <SidebarMenuButton isActive tooltip="Histórico de Aluguéis">
                      <History />
                      <span>Histórico de Aluguéis</span>
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
          <Link href="/" passHref legacyBehavior>
             <Button variant="outline" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Voltar para o Painel</span>
              </Button>
          </Link>
          <h1 className="text-xl font-semibold md:text-2xl">Histórico de Aluguéis</h1>
          <div className="ml-auto">
            <UserNav />
          </div>
        </header>

        <main className="flex-1">
          <div className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <Card className="w-full shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center">
                  <History className="mr-3 h-7 w-7 text-primary" />
                  Registros de Todas as Reservas
                </CardTitle>
                <CardDescription>
                  Visualize o histórico completo de aluguéis de vagas. Utilize os filtros para refinar sua busca.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por Residente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Residentes</SelectItem>
                      {allUsers.map(user => (
                        <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal md:col-span-1",
                          !dateRange && "text-muted-foreground"
                        )}
                      >
                        <CalendarIconLucide className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "LLL dd, y", {locale: ptBR})} -{" "}
                              {format(dateRange.to, "LLL dd, y", {locale: ptBR})}
                            </>
                          ) : (
                            format(dateRange.from, "LLL dd, y", {locale: ptBR})
                          )
                        ) : (
                          <span>Selecione um período</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                  <Button onClick={handleClearFilters} variant="outline" className="md:col-span-1">
                    <FilterX className="mr-2 h-4 w-4" />
                    Limpar Filtros
                  </Button>
                </div>

                {isLoadingData ? (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredReservations.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Vaga</TableHead>
                          <TableHead>Localização</TableHead>
                          <TableHead>Residente</TableHead>
                          <TableHead>Data de Início</TableHead>
                          <TableHead>Data de Fim</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredReservations.map((res) => (
                          <TableRow key={res.id}>
                            <TableCell className="font-medium">{res.spotNumber}</TableCell>
                            <TableCell>{res.spotLocation}</TableCell>
                            <TableCell>{res.userName}</TableCell>
                            <TableCell>{format(new Date(res.startTime), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                            <TableCell>{format(new Date(res.endTime), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <History className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">
                      {allReservations.length === 0 ? "Nenhuma reserva registrada no sistema ainda." : "Nenhuma reserva encontrada com os filtros aplicados."}
                    </p>
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

    