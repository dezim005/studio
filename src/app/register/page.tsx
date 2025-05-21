
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { Condominium } from "@/types";
import { getCondominiums } from "@/lib/condominium-service";

const registrationFormSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Endereço de email inválido").min(1, "Email é obrigatório"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
  condominiumId: z.string().optional(), // Tornar opcional no schema base
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type RegistrationFormValues = z.infer<typeof registrationFormSchema>;

export default function RegisterPage() {
  const { register, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [condominiums, setCondominiums] = React.useState<Condominium[]>([]);
  const [isLoadingCondominiums, setIsLoadingCondominiums] = React.useState(true);

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      condominiumId: "",
    },
  });

  React.useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isAuthLoading, router]);

  React.useEffect(() => {
    const fetchCondos = () => {
      setIsLoadingCondominiums(true);
      try {
        const condos = getCondominiums();
        setCondominiums(condos);
      } catch (error) {
        console.error("Erro ao buscar condomínios:", error);
        toast({ title: "Erro", description: "Não foi possível carregar a lista de condomínios.", variant: "destructive" });
      }
      setIsLoadingCondominiums(false);
    };
    fetchCondos();
  }, [toast]);

  async function onSubmit(data: RegistrationFormValues) {
    setIsSubmitting(true);

    if (condominiums.length > 0 && !data.condominiumId) {
      form.setError("condominiumId", { type: "manual", message: "Selecione o seu condomínio." });
      setIsSubmitting(false);
      return;
    }

    const result = await register({
      name: data.name,
      email: data.email,
      password: data.password,
      condominiumId: data.condominiumId, // Passa o condominiumId (pode ser undefined)
    });

    if (result.success) {
      toast({
        title: "Cadastro Bem-sucedido!",
        description: result.message,
        variant: "default",
      });
      router.push("/login");
    } else {
      toast({
        title: "Falha no Cadastro",
        description: result.message,
        variant: "destructive",
      });
      // Exemplo: form.setError("email", { type: "manual", message: result.message });
    }
    setIsSubmitting(false);
  }

  if (isAuthLoading || (!isAuthLoading && isAuthenticated)) { // Removido isLoadingCondominiums daqui para mostrar o form
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <Logo />
        </div>
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Crie Sua Conta</CardTitle>
            <CardDescription>Preencha os campos abaixo para se registrar no Vaga Livre.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Seu nome" {...field} />
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
                        <Input type="email" placeholder="usuario@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="condominiumId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condomínio</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoadingCondominiums || condominiums.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={
                              isLoadingCondominiums ? "Carregando condomínios..." :
                              condominiums.length === 0 ? "Nenhum condomínio disponível" :
                              "Selecione seu condomínio"
                            } />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {condominiums.map((condo) => (
                            <SelectItem key={condo.id} value={condo.id}>
                              {condo.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {condominiums.length === 0 && !isLoadingCondominiums && (
                          <p className="text-sm text-muted-foreground">
                              Para moradores, o síndico precisa cadastrar os condomínios primeiro.
                          </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting || isLoadingCondominiums}>
                   {isSubmitting || isLoadingCondominiums ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isSubmitting ? "Registrando..." : (isLoadingCondominiums ? "Carregando..." : "Registrar")}
                </Button>
              </form>
            </Form>
            <p className="mt-6 text-center text-sm">
              Já tem uma conta?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Faça login
              </Link>
            </p>
          </CardContent>
        </Card>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Vaga Livre. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}

    