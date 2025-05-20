
"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import type { ParkingSpot, AvailabilitySlot } from "@/types";
import { addDays, format, parseISO } from "date-fns";
import { ptBR } from 'date-fns/locale';
import type { DateRange } from "react-day-picker";
import { CalendarDays, Clock, Repeat, Trash2, PlusCircle } from "lucide-react";

const availabilitySlotSchema = z.object({
  id: z.string().optional(),
  dateRange: z.object({
    from: z.date({ required_error: "Data de início é obrigatória." }),
    to: z.date().optional(),
  }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato de hora inválido (HH:MM)"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato de hora inválido (HH:MM)"),
  isRecurring: z.boolean().default(false),
  recurrencePattern: z.enum(["daily", "weekly", "monthly"]).optional(),
}).refine(data => {
  if (data.dateRange.to && data.dateRange.from > data.dateRange.to) {
    return false; 
  }
  if (data.startTime >= data.endTime) {
    return false; 
  }
  return true;
}, {
  message: "A data/hora final deve ser posterior à data/hora inicial.",
  path: ["dateRange.to"], 
});


const formSchema = z.object({
  slots: z.array(availabilitySlotSchema)
});

type AvailabilityFormValues = z.infer<typeof formSchema>;

interface SpotAvailabilityCalendarProps {
  spot: ParkingSpot;
}

export function SpotAvailabilityCalendar({ spot }: SpotAvailabilityCalendarProps) {
  const { toast } = useToast();
  const [selectedDateRange, setSelectedDateRange] = React.useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 0),
  });

  const form = useForm<AvailabilityFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      slots: spot.availability?.map(slot => ({
        ...slot,
        dateRange: { from: slot.startTime, to: slot.endTime }, 
        startTime: format(slot.startTime, "HH:mm"),
        endTime: format(slot.endTime, "HH:mm"),
      })) || [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "slots",
  });
  
  const [editingSlotIndex, setEditingSlotIndex] = React.useState<number | null>(null);

  async function onSubmit(data: AvailabilityFormValues) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Dados de disponibilidade:", data);
    
    const processedSlots: AvailabilitySlot[] = data.slots.map((slot, index) => {
      const fromDate = slot.dateRange.from;
      const toDate = slot.dateRange.to || slot.dateRange.from;
      const [startH, startM] = slot.startTime.split(':').map(Number);
      const [endH, endM] = slot.endTime.split(':').map(Number);

      return {
        id: slot.id || `new-${Date.now()}-${index}`,
        spotId: spot.id,
        startTime: new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate(), startH, startM),
        endTime: new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), endH, endM),
        isRecurring: slot.isRecurring,
        recurrencePattern: slot.recurrencePattern,
      };
    });
    console.log("Dados de disponibilidade processados:", processedSlots);
    toast({
      title: "Disponibilidade Atualizada!",
      description: `A disponibilidade para a vaga ${spot.number} foi salva.`,
    });
  }
  
  const handleAddNewSlot = () => {
    if (!selectedDateRange?.from) {
      toast({ title: "Selecione a Data", description: "Por favor, selecione uma data ou período primeiro.", variant: "destructive"});
      return;
    }
    const newSlotBase = {
      dateRange: { from: selectedDateRange.from, to: selectedDateRange.to || selectedDateRange.from },
      startTime: "09:00",
      endTime: "17:00",
      isRecurring: false,
    };
    append(newSlotBase);
    setEditingSlotIndex(fields.length); 
    form.resetField(`slots.${fields.length}.startTime`); 
    form.resetField(`slots.${fields.length}.endTime`);
  };
  
  const handleEditSlot = (index: number) => {
    setEditingSlotIndex(index);
    const slot = fields[index];
    setSelectedDateRange(slot.dateRange);
  };

  const handleSaveSlot = (index: number) => {
    form.handleSubmit((data) => { 
      const slotData = data.slots[index];
      update(index, slotData); 
      setEditingSlotIndex(null);
      toast({ title: "Intervalo Salvo", description: "Detalhes do intervalo de disponibilidade atualizados." });
    }, (errors) => {
        console.error("Erros de validação:", errors);
        toast({ title: "Erro de Validação", description: "Por favor, verifique os detalhes do intervalo.", variant: "destructive" });
    })();
  };


  return (
    <Card className="w-full max-w-4xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center">
          <CalendarDays className="mr-2 h-6 w-6 text-primary" />
          Gerenciar Disponibilidade para Vaga {spot.number}
        </CardTitle>
        <CardDescription>
          Defina quando sua vaga de estacionamento está disponível para reservas. Selecione datas no calendário e adicione intervalos de tempo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Calendar
              mode="range"
              selected={selectedDateRange}
              onSelect={setSelectedDateRange}
              numberOfMonths={1}
              className="rounded-md border p-0"
              disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} 
              locale={ptBR}
            />
            <Button onClick={handleAddNewSlot} className="w-full mt-4">
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Novo Intervalo de Disponibilidade
            </Button>
          </div>

          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold mb-3">Intervalos de Disponibilidade Atuais</h3>
            {fields.length === 0 && (
              <p className="text-muted-foreground">Nenhum intervalo de disponibilidade definido ainda. Selecione as datas e clique em "Adicionar Novo Intervalo de Disponibilidade".</p>
            )}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {fields.map((field, index) => (
                  <Card key={field.id} className="p-4 relative">
                     <FormField
                        control={form.control}
                        name={`slots.${index}.dateRange.from`}
                        render={({ field: dateField }) => (
                            <FormItem className="hidden">
                               <FormControl><Input type="date" {...dateField} value={format(dateField.value, 'yyyy-MM-dd')} onChange={e => dateField.onChange(parseISO(e.target.value))}/></FormControl>
                            </FormItem>
                        )}
                        />
                        {form.getValues(`slots.${index}.dateRange.to`) && (
                             <FormField
                            control={form.control}
                            name={`slots.${index}.dateRange.to`}
                            render={({ field: dateField }) => (
                                <FormItem className="hidden">
                                   <FormControl><Input type="date" {...dateField} value={format(dateField.value!, 'yyyy-MM-dd')} onChange={e => dateField.onChange(parseISO(e.target.value))} /></FormControl>
                                </FormItem>
                            )}
                            />
                        )}
                    <div className="mb-2">
                        <p className="font-medium">
                            {format(form.getValues(`slots.${index}.dateRange.from`), "PPP", { locale: ptBR })}
                            {form.getValues(`slots.${index}.dateRange.to`) && form.getValues(`slots.${index}.dateRange.to`)!.getTime() !== form.getValues(`slots.${index}.dateRange.from`).getTime() 
                             ? ` - ${format(form.getValues(`slots.${index}.dateRange.to`)!, "PPP", { locale: ptBR })}`
                             : ""}
                        </p>
                    </div>
                   
                    {editingSlotIndex === index ? (
                      <>
                        <div className="grid grid-cols-2 gap-4 mb-2">
                          <FormField
                            control={form.control}
                            name={`slots.${index}.startTime`}
                            render={({ field: timeField }) => (
                              <FormItem>
                                <FormLabel>Hora de Início</FormLabel>
                                <FormControl><Input type="time" {...timeField} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`slots.${index}.endTime`}
                            render={({ field: timeField }) => (
                              <FormItem>
                                <FormLabel>Hora de Término</FormLabel>
                                <FormControl><Input type="time" {...timeField} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name={`slots.${index}.isRecurring`}
                          render={({ field: checkField }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm mb-2">
                              <FormControl><Checkbox checked={checkField.value} onCheckedChange={checkField.onChange} /></FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Recorrente</FormLabel>
                                <FormDescription>Esta disponibilidade é recorrente?</FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        {form.watch(`slots.${index}.isRecurring`) && (
                          <FormField
                            control={form.control}
                            name={`slots.${index}.recurrencePattern`}
                            render={({ field: selectField }) => (
                              <FormItem>
                                <FormLabel>Padrão de Recorrência</FormLabel>
                                <Select onValueChange={selectField.onChange} defaultValue={selectField.value}>
                                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione o padrão" /></SelectTrigger></FormControl>
                                  <SelectContent>
                                    <SelectItem value="daily">Diariamente</SelectItem>
                                    <SelectItem value="weekly">Semanalmente</SelectItem>
                                    <SelectItem value="monthly">Mensalmente</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        <div className="flex gap-2 mt-2">
                           <Button type="button" size="sm" onClick={() => handleSaveSlot(index)}>Salvar Intervalo</Button>
                           <Button type="button" variant="outline" size="sm" onClick={() => setEditingSlotIndex(null)}>Cancelar</Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center space-x-2 text-sm mb-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{form.getValues(`slots.${index}.startTime`)} - {form.getValues(`slots.${index}.endTime`)}</span>
                        </div>
                        {form.getValues(`slots.${index}.isRecurring`) && (
                           <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                             <Repeat className="h-4 w-4" />
                             <span>Recorrente {form.getValues(`slots.${index}.recurrencePattern`) === 'daily' ? 'Diariamente' : form.getValues(`slots.${index}.recurrencePattern`) === 'weekly' ? 'Semanalmente' : 'Mensalmente'}</span>
                           </div>
                        )}
                        <div className="absolute top-2 right-2 flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditSlot(index)}>
                            <CalendarDays className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </>
                    )}
                    {form.formState.errors.slots?.[index] && (
                        <p className="text-sm font-medium text-destructive mt-1">
                            {/* @ts-ignore TODO: fix this type error */}
                            {Object.values(form.formState.errors.slots[index]!).map(err => typeof err === 'object' && err?.message ? err.message : '').filter(Boolean).join(', ')}
                        </p>
                    )}
                  </Card>
                ))}
                {fields.length > 0 && (
                  <Button type="submit" className="mt-6" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Salvando Tudo..." : "Salvar Todas as Alterações"}
                  </Button>
                )}
              </form>
            </Form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
