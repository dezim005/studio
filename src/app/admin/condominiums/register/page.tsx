
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import { LayoutDashboard, ParkingSquare, CalendarCheck, ArrowLeft, Loader2, Building, Users, Bookmark, History, UserCheck, PlusCircle } from "lucide-react"; // Adicionado UserCheck
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { addCondominium } from "@/lib/condominium-service";
import { cn } from "@/lib/utils";

const condominiumSchema = z.object({
  name: z.string().min(3, "O nome do condomínio deve ter pelo menos 3 caracteres."),
  address: z.string().min(5, "O endereço deve ter pelo menos 5 caracteres."),
});

type CondominiumFormValues = z.infer<typeof condominiumSchema>;

export default function RegisterCondominiumPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { isMobile, state: sidebarState } = useSidebar();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<CondominiumFormValues>({
    resolver: zodResolver(condominiumSchema),
    defaultValues: {
      name: "",
      address: "",
    },
  });

  React.useEffect(() => {
    if (!isAuthLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (user?.role !== 'manager') {
        toast({ title: "Acesso Negado", description: "Você não tem permissão para acessar esta página.", variant: "destructive" });
        router.push("/");
      }
    }
  }, [isAuthenticated, isAuthLoading, user, router, toast]);

  async function onSubmit(data: CondominiumFormValues) {
    setIsSubmitting(true);
    try {
      addCondominium({ name: data.name, address: data.address });
      toast({
        title: "Condomínio Cadastrado!",
        description: `O condomínio "${data.name}" foi cadastrado com sucesso.`,
      });
      form.reset();
      // router.push("/admin/condominiums"); 
    } catch (error) {
      toast({
        title: "Falha no Cadastro",
        description: "Ocorreu um erro ao cadastrar o condomínio.",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  }

  if (isAuthLoading || !isAuthenticated || user?.role !== 'manager') {
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
            {user?.role === 'manager' && (
              <SidebarGroup>
                <SidebarGroupLabel className="pt-4">Administração</SidebarGroupLabel>
                <SidebarMenuItem>
                  <Link href="/admin/condominiums/register" legacyBehavior passHref>
                    <SidebarMenuButton isActive tooltip="Cadastrar Condomínio">
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
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
          {isMobile && <SidebarTrigger />}
          <Link href="/" passHref legacyBehavior>
             <Button variant="outline" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Voltar para o Painel</span>
              </Button>
          </Link>
          <h1 className="text-xl font-semibold md:text-2xl">Cadastrar Novo Condomínio</h1>
          <div className="ml-auto">
            <UserNav />
          </div>
        </header>

        <main className="flex-1">
          <div className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <Card className="w-full max-w-2xl mx-auto shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center">
                  <Building className="mr-3 h-7 w-7 text-primary" />
                  Dados do Condomínio
                </CardTitle>
                <CardDescription>
                  Preencha as informações abaixo para adicionar um novo condomínio ao sistema.
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
                          <FormLabel>Nome do Condomínio</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Residencial Flores" {...field} />
                          </FormControl>
                          <FormDescription>
                            O nome oficial do condomínio.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Endereço Completo</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Ex: Rua das Palmeiras, 123, Bairro Sol, Cidade Alegre - UF, CEP 12345-678"
                              className="resize-none"
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            O endereço completo do condomínio.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isSubmitting ? "Cadastrando..." : "Cadastrar Condomínio"}
                    </Button>
                  </form>
                </Form>
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
