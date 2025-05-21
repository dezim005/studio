
"use client";

import * as React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  SidebarGroup,
  SidebarGroupLabel
} from "@/components/ui/sidebar";
import { LayoutDashboard, ParkingSquare, CalendarCheck, User as UserIcon, Loader2, ArrowLeft, Building, Users, Bookmark } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@/types";
import { getCondominiumById } from "@/lib/condominium-service"; 

const profileFormSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
  email: z.string().email("Email inválido.").describe("Seu endereço de email. Não pode ser alterado."),
  apartment: z.string().min(1, "Número do apartamento é obrigatório."),
  dateOfBirth: z.string().optional().describe("Sua data de nascimento."),
  cpf: z.string().optional().refine(val => !val || /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(val), {
    message: "Formato de CPF inválido (use XXX.XXX.XXX-XX).",
  }).describe("Seu CPF (Cadastro de Pessoa Física)."),
  phone: z.string().optional().refine(val => !val || /^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(val), {
    message: "Formato de telefone inválido (use (XX) XXXXX-XXXX).",
  }).describe("Seu número de telefone."),
  description: z.string().max(200, "A descrição não pode exceder 200 caracteres.").optional().describe("Uma breve descrição sobre você."),
  condominiumName: z.string().optional().describe("Nome do seu condomínio."), 
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading: isAuthLoading, updateUserProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { isMobile } = useSidebar();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [condominiumName, setCondominiumName] = React.useState<string | undefined>(undefined);


  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      apartment: user?.apartment || "",
      dateOfBirth: user?.dateOfBirth || "",
      cpf: user?.cpf || "",
      phone: user?.phone || "",
      description: user?.description || "",
      condominiumName: "", 
    },
  });

  React.useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isAuthLoading, router]);

  React.useEffect(() => {
    if (user) {
      let condoName = "Não especificado";
      if (user.condominiumId) {
        const condo = getCondominiumById(user.condominiumId);
        if (condo) {
          condoName = condo.name;
        }
      }
      setCondominiumName(condoName);

      form.reset({
        name: user.name || "",
        email: user.email || "",
        apartment: user.apartment || "",
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : "", 
        cpf: user.cpf || "",
        phone: user.phone || "",
        description: user.description || "",
        condominiumName: condoName,
      });
    }
  }, [user, form]);

  async function onSubmit(data: ProfileFormValues) {
    if (!user) return;
    setIsSubmitting(true);

    const profileDataToUpdate: Partial<User> = {
      name: data.name,
      apartment: data.apartment,
      dateOfBirth: data.dateOfBirth,
      cpf: data.cpf,
      phone: data.phone,
      description: data.description,
    };

    const result = await updateUserProfile(profileDataToUpdate);
    if (result.success) {
      toast({
        title: "Perfil Atualizado!",
        description: result.message,
        variant: "default",
      });
    } else {
      toast({
        title: "Falha na Atualização",
        description: result.message,
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  }

  if (isAuthLoading || !isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
           <Link href="/" passHref legacyBehavior>
             <Button variant="outline" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Voltar para o Painel</span>
              </Button>
          </Link>
          <h1 className="text-xl font-semibold md:text-2xl">Meu Perfil</h1>
          <div className="ml-auto">
            <UserNav />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Card className="w-full max-w-2xl mx-auto shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center">
                <UserIcon className="mr-3 h-7 w-7 text-primary" />
                Informações Pessoais
              </CardTitle>
              <CardDescription>
                Visualize e atualize seus dados cadastrais. Mantenha suas informações sempre corretas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                          <Input placeholder="Seu nome completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} readOnly disabled className="cursor-not-allowed bg-muted/50"/>
                        </FormControl>
                        <FormDescription>
                          Seu email de login. Não pode ser alterado.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {user.role === 'resident' && user.condominiumId && (
                    <FormField
                      control={form.control}
                      name="condominiumName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Condomínio</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly disabled className="cursor-not-allowed bg-muted/50"/>
                          </FormControl>
                          <FormDescription>
                            Seu condomínio. Não pode ser alterado aqui.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <FormField
                    control={form.control}
                    name="apartment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apartamento</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Bloco A, Apto 101" {...field} />
                        </FormControl>
                        <FormDescription>
                          Número do seu apartamento e bloco, se aplicável.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Nascimento (Opcional)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
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
                          <Textarea
                            placeholder="Conte um pouco sobre você..."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Máximo de 200 caracteres.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting || !form.formState.isDirty}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </form>
              </Form>
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
