
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
import { Logo } from "@/components/logo";
import { UserNav } from "@/components/layout/user-nav";
import type { User, Condominium } from "@/types";
import { getUsers, updateUser } from "@/lib/user-service";
import { getCondominiumById } from "@/lib/condominium-service";
import { LayoutDashboard, ParkingSquare, CalendarCheck, Building, Users as UsersIcon, ArrowLeft, Loader2, UserCheck, UserX, Bookmark, History, CheckCircle2, XCircle, Hourglass } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function ManageApprovalsPage() {
  const { user: currentUser, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { isMobile, state: sidebarState } = useSidebar();
  
  const [pendingUsers, setPendingUsers] = React.useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = React.useState(true);

  React.useEffect(() => {
    if (!isAuthLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (currentUser?.role !== 'manager') {
        toast({ title: "Acesso Negado", description: "Você não tem permissão para acessar esta página.", variant: "destructive" });
        router.push("/");
      }
    }
  }, [isAuthenticated, isAuthLoading, currentUser, router, toast]);

  const fetchPendingUsers = React.useCallback(() => {
    if (isAuthenticated && currentUser?.role === 'manager') {
      setIsLoadingUsers(true);
      const allUsers = getUsers();
      setPendingUsers(allUsers.filter(u => u.status === 'pending'));
      setIsLoadingUsers(false);
    }
  }, [isAuthenticated, currentUser]);

  React.useEffect(() => {
    fetchPendingUsers();
  }, [fetchPendingUsers]);

  const handleApprovalAction = async (userId: string, newStatus: 'approved' | 'denied') => {
    const userToUpdate = pendingUsers.find(u => u.id === userId);
    if (!userToUpdate) return;

    const updatedUser = updateUser(userId, { status: newStatus });

    if (updatedUser) {
      toast({
        title: `Cadastro ${newStatus === 'approved' ? 'Aprovado' : 'Negado'}`,
        description: `O cadastro de ${userToUpdate.name} foi ${newStatus === 'approved' ? 'aprovado' : 'negado'} com sucesso.`,
      });
      fetchPendingUsers(); // Re-fetch para atualizar a lista
    } else {
      toast({
        title: "Falha na Operação",
        description: `Não foi possível ${newStatus === 'approved' ? 'aprovar' : 'negar'} o cadastro.`,
        variant: "destructive",
      });
    }
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch (e) {
      return "Data Inválida";
    }
  };


  if (isAuthLoading || !isAuthenticated || currentUser?.role !== 'manager') {
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
                    <SidebarMenuButton tooltip="Histórico de Aluguéis">
                      <History />
                      <span>Histórico de Aluguéis</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link href="/admin/approvals" legacyBehavior passHref>
                    <SidebarMenuButton isActive tooltip="Aprovações de Cadastro">
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
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
          {isMobile && <SidebarTrigger />}
          <Link href="/" passHref legacyBehavior>
             <Button variant="outline" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Voltar para o Painel</span>
              </Button>
          </Link>
          <h1 className="text-xl font-semibold md:text-2xl">Aprovações de Cadastro</h1>
          <div className="ml-auto">
            <UserNav />
          </div>
        </header>

        <main className="flex-1">
          <div className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <Card className="w-full shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center">
                  <Hourglass className="mr-3 h-7 w-7 text-primary" />
                  Cadastros de Residentes Pendentes
                </CardTitle>
                <CardDescription>
                  Aprove ou negue os pedidos de cadastro de novos residentes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingUsers ? (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : pendingUsers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Apartamento</TableHead>
                          <TableHead>Condomínio</TableHead>
                          <TableHead>Data Cadastro</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingUsers.map((user) => {
                          const condominium = user.condominiumId ? getCondominiumById(user.condominiumId) : null;
                          return (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">{user.name}</TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>{user.apartment || "N/A"}</TableCell>
                              <TableCell>{condominium ? condominium.name : "N/A"}</TableCell>
                              <TableCell>{formatDate(user.registrationDate)}</TableCell>
                              <TableCell className="text-right space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="border-green-500 text-green-600 hover:bg-green-500 hover:text-white"
                                  onClick={() => handleApprovalAction(user.id, 'approved')}
                                >
                                  <CheckCircle2 className="mr-1 h-3 w-3" /> Aprovar
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm" 
                                  onClick={() => handleApprovalAction(user.id, 'denied')}
                                >
                                  <XCircle className="mr-1 h-3 w-3" /> Negar
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <UserCheck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">Nenhum cadastro pendente de aprovação no momento.</p>
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
