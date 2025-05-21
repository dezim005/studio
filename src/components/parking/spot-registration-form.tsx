
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation"; // Importar useRouter

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ParkingSquare, Loader2 } from "lucide-react"; // Importar Loader2
import { useAuth } from "@/contexts/auth-context";
import { addParkingSpot } from "@/lib/parking-spot-service";

const spotRegistrationSchema = z.object({
  spotNumber: z.string().min(1, "Número da vaga é obrigatório"),
  spotType: z.enum(["compact", "standard", "suv", "motorcycle"], {
    required_error: "Tipo da vaga é obrigatório.",
  }),
  locationDetails: z.string().min(5, "Detalhes da localização devem ter pelo menos 5 caracteres"),
  additionalNotes: z.string().optional(),
});

type SpotRegistrationFormValues = z.infer<typeof spotRegistrationSchema>;

export function SpotRegistrationForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter(); // Inicializar useRouter
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<SpotRegistrationFormValues>({
    resolver: zodResolver(spotRegistrationSchema),
    defaultValues: {
      spotNumber: "",
      locationDetails: "",
      additionalNotes: "",
    },
  });

  async function onSubmit(data: SpotRegistrationFormValues) {
    if (!user) {
      toast({
        title: "Erro de Autenticação",
        description: "Você precisa estar logado para cadastrar uma vaga.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 700)); // Simular chamada de API

    try {
      addParkingSpot({
        number: data.spotNumber,
        type: data.spotType,
        location: data.locationDetails,
        description: data.additionalNotes,
        ownerId: user.id,
      });
      toast({
        title: "Vaga Cadastrada!",
        description: `A vaga ${data.spotNumber} foi cadastrada com sucesso.`,
        variant: "default"
      });
      form.reset();
      router.push("/my-spots"); // Redirecionar para a lista de vagas
    } catch (error) {
      toast({
        title: "Falha no Cadastro",
        description: "Ocorreu um erro ao cadastrar a vaga.",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center">
          <ParkingSquare className="mr-2 h-6 w-6 text-primary" />
          Cadastrar Nova Vaga de Estacionamento
        </CardTitle>
        <CardDescription>
          Forneça os detalhes da sua vaga de estacionamento para disponibilizá-la para outros.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="spotNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número da Vaga</FormLabel>
                  <FormControl>
                    <Input placeholder="ex: A01, 12B" {...field} />
                  </FormControl>
                  <FormDescription>
                    O identificador único para sua vaga de estacionamento.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="spotType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo da Vaga</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um tipo de vaga" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="compact">Compacto</SelectItem>
                      <SelectItem value="standard">Padrão</SelectItem>
                      <SelectItem value="suv">SUV / Grande</SelectItem>
                      <SelectItem value="motorcycle">Moto</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Escolha o tipo que melhor descreve sua vaga de estacionamento.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="locationDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detalhes da Localização</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="ex: Nível 2, perto do elevador norte, coberta"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Seja específico sobre a localização para ajudar outros a encontrá-la facilmente.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="additionalNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações Adicionais (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="ex: Vaga estreita, carregamento EV disponível nas proximidades"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                   <FormDescription>
                    Qualquer outra informação relevante sobre a vaga.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Cadastrando..." : "Cadastrar Vaga"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
