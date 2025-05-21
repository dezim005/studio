
"use client";

import * as React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { getCondominiumById, getCondominiums } from "@/lib/condominium-service";
import { LayoutDashboard, ParkingSquare, CalendarCheck, Building, Users as UsersIcon, ArrowLeft, Loader2, Eye, Edit2, User as UserIconLucide, Mail, Building2, Calendar as CalendarIconLucide, Hash, PhoneIcon, Bookmark } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const editUserSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
  email: z.string().email(), // Readonly
  apartment: z.string().min(1, "Número do apartamento é obrigatório."),
  role: z.enum(["resident", "manager"], { required_error: "O papel do usuário é obrigatório."}),
  condominiumId: z.string().optional(),
  dateOfBirth: z.string().optional(),
  cpf: z.string().optional().refine(val => !val || /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(val), {
    message: "Formato de CPF inválido (use XXX.XXX.XXX-XX).",
  }),
  phone: z.string().optional().refine(val => !val || /^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(val), {
    message: "Formato de telefone inválido (use (XX) XXXXX-XXXX).",
  }),
  description: z.string().max(200, "A descrição não pode exceder 200 caracteres.").optional(),
}).refine(data => data.role === 'manager' || (data.role === 'resident' && data.condominiumId), {
  message: "Moradores devem estar associados a um condomínio.",
  path: ["condominiumId"],
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

export default function ManageUsersPage() {
  const { user: currentUser, isAuthenticated, isLoading: isAuthLoading, setUser: setAuthUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { isMobile } = useSidebar();
  const [allUsers, setAllUsers] = React.useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = React.useState(true);
  const [condominiums, setCondominiums] = React.useState<Condominium[]>([]);

  const [selectedUserForView, setSelectedUserForView] = React.useState<User | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = React.useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = React.useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = React.useState(false);

  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
  });

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

  React.useEffect(() => {
    if (isAuthenticated && currentUser?.role === 'manager') {
      setIsLoadingUsers(true);
      const usersFromService = getUsers();
      setAllUsers(usersFromService);
      const condos = getCondominiums();
      setCondominiums(condos);
      setIsLoadingUsers(false);
    }
  }, [isAuthenticated, currentUser]);
  
  React.useEffect(() => {
    if (selectedUserForEdit) {
      form.reset({
        name: selectedUserForEdit.name || "",
        email: selectedUserForEdit.email || "",
        apartment: selectedUserForEdit.apartment || "",
        role: selectedUserForEdit.role,
        condominiumId: selectedUserForEdit.condominiumId || "",
        dateOfBirth: selectedUserForEdit.dateOfBirth ? selectedUserForEdit.dateOfBirth.split('T')[0] : "",
        cpf: selectedUserForEdit.cpf || "",
        phone: selectedUserForEdit.phone || "",
        description: selectedUserForEdit.description || "",
      });
    }
  }, [selectedUserForEdit, form]);

  const handleOpenViewDialog = (user: User) => {
    setSelectedUserForView(user);
    setIsViewDialogOpen(true);
  };

  const handleOpenEditDialog = (user: User) => {
    setSelectedUserForEdit(user);
    setIsEditDialogOpen(true);
  };

  const formatCPF = (value: string) => {
    const cpf = value.replace(/\D/g, '');
    if (cpf.length <= 3) return cpf;
    if (cpf.length <= 6) return `${cpf.slice(0, 3)}.${cpf.slice(3)}`;
    if (cpf.length <= 9) return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6)}`;
    return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9, 11)}`;
  };

  const formatPhone = (value: string) => {
    const phone = value.replace(/\D/g, '');
    if (phone.length <= 2) return `(${phone}`;
    if (phone.length <= 6) return `(${phone.slice(0, 2)}) ${phone.slice(2)}`;
    if (phone.length <= 10) return `(${phone.slice(0, 2)}) ${phone.slice(2, 6)}-${phone.slice(6)}`;
    return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7, 11)}`;
  };

  async function onEditSubmit(data: EditUserFormValues) {
    if (!selectedUserForEdit) return;
    setIsSubmittingEdit(true);

    const updatedUserData: Partial<User> = {
      name: data.name,
      apartment: data.apartment,
      role: data.role,
      condominiumId: data.role === 'resident' ? data.condominiumId : undefined, 
      dateOfBirth: data.dateOfBirth,
      cpf: data.cpf,
      phone: data.phone,
      description: data.description,
    };

    const updatedUser = updateUser(selectedUserForEdit.id, updatedUserData);

    if (updatedUser) {
      setAllUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
      if (currentUser?.id === updatedUser.id) { 
        setAuthUser(updatedUser); 
      }
      toast({ title: "Usuário Atualizado", description: `Os dados de ${updatedUser.name} foram atualizados.` });
      setIsEditDialogOpen(false);
    } else {
      toast({ title: "Falha na Atualização", description: "Não foi possível atualizar os dados do usuário.", variant: "destructive" });
    }
    setIsSubmittingEdit(false);
  }


  if (isAuthLoading || !isAuthenticated || currentUser?.role !== 'manager') {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const watchedRole = form.watch("role");

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
                    <SidebarMenuButton isActive tooltip="Gerenciar Usuários">
                      <UsersIcon />
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
          <Link href="/" passHref legacyBehavior>
             <Button variant="outline" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Voltar para o Painel</span>
              </Button>
          </Link>
          <h1 className="text-xl font-semibold md:text-2xl">Gerenciar Usuários</h1>
          <div className="ml-auto">
            <UserNav />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Card className="w-full shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center">
                <UsersIcon className="mr-3 h-7 w-7 text-primary" />
                Lista de Usuários Cadastrados
              </CardTitle>
              <CardDescription>
                Visualize e gerencie os usuários do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : allUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Apartamento</TableHead>
                        <TableHead>Condomínio</TableHead>
                        <TableHead>Papel</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allUsers.map((user) => {
                        const condominium = user.condominiumId ? getCondominiumById(user.condominiumId) : null;
                        return (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.apartment || "N/A"}</TableCell>
                            <TableCell>{condominium ? condominium.name : "N/A"}</TableCell>
                            <TableCell>
                              <Badge variant={user.role === 'manager' ? "default" : "secondary"}>
                                {user.role === 'manager' ? 'Síndico' : 'Morador'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button variant="outline" size="sm" onClick={() => handleOpenViewDialog(user)}>
                                <Eye className="mr-1 h-3 w-3" /> Ver
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleOpenEditDialog(user)}>
                                <Edit2 className="mr-1 h-3 w-3" /> Editar
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
                  <UsersIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">Nenhum usuário cadastrado no sistema ainda (além de você, se for síndico).</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
        <footer className="border-t p-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Vaga Livre. Todos os direitos reservados.
        </footer>
      </SidebarInset>

      {selectedUserForView && (
        <AlertDialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center">
                <UserIconLucide className="mr-2 h-6 w-6 text-primary" /> Detalhes de {selectedUserForView.name}
              </AlertDialogTitle>
              <AlertDialogDescription>
                Informações detalhadas do usuário.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-3 py-4 text-sm">
              <div className="flex items-center"><UserIconLucide className="mr-2 h-4 w-4 text-muted-foreground" /><strong>Nome:</strong><span className="ml-2">{selectedUserForView.name}</span></div>
              <div className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground" /><strong>Email:</strong><span className="ml-2">{selectedUserForView.email}</span></div>
              <div className="flex items-center"><Building className="mr-2 h-4 w-4 text-muted-foreground" /><strong>Apartamento:</strong><span className="ml-2">{selectedUserForView.apartment || "N/A"}</span></div>
              {selectedUserForView.condominiumId && (
                <div className="flex items-center"><Building2 className="mr-2 h-4 w-4 text-muted-foreground" /><strong>Condomínio:</strong><span className="ml-2">{getCondominiumById(selectedUserForView.condominiumId)?.name || "N/A"}</span></div>
              )}
              <div className="flex items-center"><UsersIcon className="mr-2 h-4 w-4 text-muted-foreground" /><strong>Papel:</strong><span className="ml-2">{selectedUserForView.role === 'manager' ? 'Síndico' : 'Morador'}</span></div>
              <div className="flex items-center"><CalendarIconLucide className="mr-2 h-4 w-4 text-muted-foreground" /><strong>Data de Nascimento:</strong><span className="ml-2">{selectedUserForView.dateOfBirth || "N/A"}</span></div>
              <div className="flex items-center"><Hash className="mr-2 h-4 w-4 text-muted-foreground" /><strong>CPF:</strong><span className="ml-2">{selectedUserForView.cpf || "N/A"}</span></div>
              <div className="flex items-center"><PhoneIcon className="mr-2 h-4 w-4 text-muted-foreground" /><strong>Telefone:</strong><span className="ml-2">{selectedUserForView.phone || "N/A"}</span></div>
              <div className="flex items-start"><UserIconLucide className="mr-2 h-4 w-4 text-muted-foreground shrink-0" /><strong>Descrição:</strong><p className="ml-2 break-words">{selectedUserForView.description || "N/A"}</p></div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsViewDialogOpen(false)}>Fechar</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {selectedUserForEdit && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar Usuário: {selectedUserForEdit.name}</DialogTitle>
              <DialogDescription>
                Modifique os dados do usuário abaixo. Clique em salvar quando terminar.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem>
                  <FormLabel>Email (Não editável)</FormLabel>
                  <FormControl><Input value={selectedUserForEdit.email} readOnly disabled className="cursor-not-allowed bg-muted/50"/></FormControl>
                </FormItem>
                <FormField
                  control={form.control}
                  name="apartment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apartamento</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Papel</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione um papel" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="resident">Morador</SelectItem>
                          <SelectItem value="manager">Síndico</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {watchedRole === 'resident' && (
                  <FormField
                    control={form.control}
                    name="condominiumId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condomínio</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={condominiums.length === 0}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={condominiums.length === 0 ? "Nenhum condomínio cadastrado" : "Selecione o condomínio"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {condominiums.map(condo => (
                              <SelectItem key={condo.id} value={condo.id}>{condo.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {condominiums.length === 0 && <FormDescription>Nenhum condomínio cadastrado para associar.</FormDescription>}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                 <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Nascimento (Opcional)</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF (Opcional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="XXX.XXX.XXX-XX"
                            {...field}
                            onChange={(e) => field.onChange(formatCPF(e.target.value))}
                            maxLength={14}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone (Opcional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="(XX) XXXXX-XXXX"
                            {...field}
                            onChange={(e) => field.onChange(formatPhone(e.target.value))}
                            maxLength={15}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Breve Descrição (Opcional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Uma breve descrição..." className="resize-none" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancelar</Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSubmittingEdit}>
                    {isSubmittingEdit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Alterações
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
