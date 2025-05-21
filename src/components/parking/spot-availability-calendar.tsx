
"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { addDays, format, parseISO, startOfDay } from "date-fns"; // Adicionado startOfDay
import { ptBR } from 'date-fns/locale';
import type { DateRange } from "react-day-picker";
import { CalendarDays, Clock, Repeat, Trash2, PlusCircle, Loader2 } from "lucide-react"; // Adicionado Loader2

// Schema para um único slot de disponibilidade no formulário
const formAvailabilitySlotSchema = z.object({
  id: z.string().optional(), // Usado para manter rastreamento dos slots existentes
  dateRange: z.object({
    from: z.date({ required_error: "Data de início é obrigatória." }),
    to: z.date().optional(),
  }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato de hora inválido (HH:MM)"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato de hora inválido (HH:MM)"),
  isRecurring: z.boolean().default(false),
  recurrencePattern: z.enum(["daily", "weekly", "monthly"]).optional(),
}).refine(data => {
  const fromDateTime = new Date(data.dateRange.from);
  const [startH, startM] = data.startTime.split(':').map(Number);
  fromDateTime.setHours(startH, startM, 0, 0);

  const toDate = data.dateRange.to || data.dateRange.from;
  const endDateTime = new Date(toDate);
  const [endH, endM] = data.endTime.split(':').map(Number);
  endDateTime.setHours(endH, endM, 0, 0);
  
  return endDateTime > fromDateTime;
}, {
  message: "A data/hora final deve ser posterior à data/hora inicial.",
  path: ["endTime"], 
});


const formSchema = z.object({
  slots: z.array(formAvailabilitySlotSchema)
});

type AvailabilityFormValues = z.infer<typeof formSchema>;

interface SpotAvailabilityCalendarProps {
  spot: ParkingSpot;
  onSave: (availabilitySlots: AvailabilitySlot[]) => Promise<void>; // Função para salvar
}

export function SpotAvailabilityCalendar({ spot, onSave }: SpotAvailabilityCalendarProps) {
  const { toast } = useToast();
  const [selectedDateRange, setSelectedDateRange] = React.useState<DateRange | undefined>({
    from: startOfDay(new Date()), // Garante que 'from' começa no início do dia
    to: startOfDay(addDays(new Date(), 0)), // Garante que 'to' começa no início do dia
  });
  const [isSubmittingGlobal, setIsSubmittingGlobal] = React.useState(false);


  const form = useForm<AvailabilityFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      slots: spot.availability?.map(slot => ({
        id: slot.id,
        dateRange: { from: startOfDay(new Date(slot.startTime)), to: startOfDay(new Date(slot.endTime)) }, 
        startTime: format(new Date(slot.startTime), "HH:mm"),
        endTime: format(new Date(slot.endTime), "HH:mm"),
        isRecurring: slot.isRecurring,
        recurrencePattern: slot.recurrencePattern,
      })) || [],
    },
  });
  
  // Atualizar form quando o spot mudar (ex: após salvar e receber novo spot)
  React.useEffect(() => {
    form.reset({
      slots: spot.availability?.map(slot => ({
        id: slot.id,
        dateRange: { from: startOfDay(new Date(slot.startTime)), to: startOfDay(new Date(slot.endTime)) },
        startTime: format(new Date(slot.startTime), "HH:mm"),
        endTime: format(new Date(slot.endTime), "HH:mm"),
        isRecurring: slot.isRecurring,
        recurrencePattern: slot.recurrencePattern,
      })) || [],
    });
  }, [spot, form]);


  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "slots",
  });
  
  const [editingSlotIndex, setEditingSlotIndex] = React.useState<number | null>(null);

  async function onSubmit(data: AvailabilityFormValues) {
    setIsSubmittingGlobal(true);
    // Mapear dados do formulário para o tipo AvailabilitySlot esperado pelo backend/serviço
    const processedSlots: AvailabilitySlot[] = data.slots.map((formSlot, index) => {
      const fromDate = formSlot.dateRange.from;
      const toDate = formSlot.dateRange.to || formSlot.dateRange.from; // Se 'to' não existir, usa 'from'
      const [startH, startM] = formSlot.startTime.split(':').map(Number);
      const [endH, endM] = formSlot.endTime.split(':').map(Number);

      const startTime = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate(), startH, startM);
      const endTime = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), endH, endM);
      
      return {
        id: formSlot.id || `new-${Date.now()}-${index}`, // Gera ID para novos slots
        spotId: spot.id,
        startTime: startTime,
        endTime: endTime,
        isRecurring: formSlot.isRecurring,
        recurrencePattern: formSlot.isRecurring ? formSlot.recurrencePattern : undefined,
      };
    });
    
    await onSave(processedSlots); // Chama a função onSave passada como prop
    setEditingSlotIndex(null); // Sai do modo de edição após salvar globalmente
    setIsSubmittingGlobal(false);
  }
  
  const handleAddNewSlot = () => {
    if (!selectedDateRange?.from) {
      toast({ title: "Selecione a Data", description: "Por favor, selecione uma data ou período primeiro.", variant: "destructive"});
      return;
    }
    const newSlotBase = {
      id: `temp-${Date.now()}`, // ID temporário para o array field
      dateRange: { 
        from: startOfDay(selectedDateRange.from), 
        to: selectedDateRange.to ? startOfDay(selectedDateRange.to) : startOfDay(selectedDateRange.from) 
      },
      startTime: "09:00",
      endTime: "17:00",
      isRecurring: false,
      recurrencePattern: undefined,
    };
    append(newSlotBase);
    setEditingSlotIndex(fields.length); 
  };
  
  const handleEditSlot = (index: number) => {
    setEditingSlotIndex(index);
    const slot = form.getValues(`slots.${index}`);
    if(slot.dateRange.from) {
      setSelectedDateRange({
        from: startOfDay(new Date(slot.dateRange.from)),
        to: slot.dateRange.to ? startOfDay(new Date(slot.dateRange.to)) : startOfDay(new Date(slot.dateRange.from))
      });
    }
  };

  const handleSaveEditingSlot = (index: number) => {
    // Apenas valida o slot atual e o mantém no formulário, não salva globalmente ainda.
    // O salvamento global ocorre com o botão "Salvar Todas as Alterações".
    form.trigger(`slots.${index}`).then(isValid => {
      if (isValid) {
        setEditingSlotIndex(null);
        toast({ title: "Intervalo Atualizado", description: "Detalhes do intervalo prontos para salvar." });
      } else {
        toast({ title: "Erro de Validação", description: "Por favor, verifique os detalhes do intervalo.", variant: "destructive" });
      }
    });
  };

  const handleDateChangeForEditingSlot = (index: number, newDateRange: DateRange | undefined) => {
    if (newDateRange?.from) {
      form.setValue(`slots.${index}.dateRange.from`, startOfDay(newDateRange.from), { shouldValidate: true });
      if (newDateRange.to) {
        form.setValue(`slots.${index}.dateRange.to`, startOfDay(newDateRange.to), { shouldValidate: true });
      } else {
         form.setValue(`slots.${index}.dateRange.to`, undefined, { shouldValidate: true }); // ou from
      }
    }
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <Calendar
                  mode="range"
                  selected={selectedDateRange}
                  onSelect={ editingSlotIndex !== null ? (date) => handleDateChangeForEditingSlot(editingSlotIndex, date) : setSelectedDateRange}
                  numberOfMonths={1}
                  className="rounded-md border p-0"
                  disabled={(date) => date < startOfDay(new Date())} 
                  locale={ptBR}
                />
                <Button type="button" onClick={handleAddNewSlot} className="w-full mt-4" disabled={editingSlotIndex !== null}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Novo Intervalo
                </Button>
              </div>

              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold mb-3">Intervalos de Disponibilidade</h3>
                {fields.length === 0 && (
                  <p className="text-muted-foreground text-sm">Nenhum intervalo definido. Selecione as datas e clique em "Adicionar Novo Intervalo".</p>
                )}
                
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {fields.map((fieldItem, index) => (
                    <Card key={fieldItem.id} className="p-4 relative">
                      <div className="mb-2">
                          <p className="font-medium text-sm">
                              {form.getValues(`slots.${index}.dateRange.from`) ? format(form.getValues(`slots.${index}.dateRange.from`), "PPP", { locale: ptBR }) : "Data de Início"}
                              {form.getValues(`slots.${index}.dateRange.to`) && form.getValues(`slots.${index}.dateRange.to`)!.getTime() !== form.getValues(`slots.${index}.dateRange.from`)?.getTime() 
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
                                  <FormLabel className="text-xs">Hora de Início</FormLabel>
                                  <FormControl><Input type="time" {...timeField} /></FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`slots.${index}.endTime`}
                              render={({ field: timeField }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Hora de Término</FormLabel>
                                  <FormControl><Input type="time" {...timeField} /></FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={form.control}
                            name={`slots.${index}.isRecurring`}
                            render={({ field: checkField }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 shadow-sm mb-2">
                                <FormControl><Checkbox checked={checkField.value} onCheckedChange={checkField.onChange} /></FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="text-sm">Recorrente</FormLabel>
                                  <FormDescription className="text-xs">Esta disponibilidade é recorrente?</FormDescription>
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
                                  <FormLabel className="text-xs">Padrão de Recorrência</FormLabel>
                                  <Select onValueChange={selectField.onChange} defaultValue={selectField.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione o padrão" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                      <SelectItem value="daily">Diariamente</SelectItem>
                                      <SelectItem value="weekly">Semanalmente</SelectItem>
                                      <SelectItem value="monthly">Mensalmente</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                          )}
                          <div className="flex gap-2 mt-3">
                             <Button type="button" size="sm" onClick={() => handleSaveEditingSlot(index)}>Confirmar Intervalo</Button>
                             <Button type="button" variant="outline" size="sm" onClick={() => { remove(index); setEditingSlotIndex(null); }}>Cancelar</Button>
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
                               <span>Recorrente {
                                form.getValues(`slots.${index}.recurrencePattern`) === 'daily' ? 'Diariamente' :
                                form.getValues(`slots.${index}.recurrencePattern`) === 'weekly' ? 'Semanalmente' :
                                form.getValues(`slots.${index}.recurrencePattern`) === 'monthly' ? 'Mensalmente' : ''
                               }</span>
                             </div>
                          )}
                          <div className="absolute top-2 right-2 flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditSlot(index)} disabled={editingSlotIndex !== null && editingSlotIndex !== index}>
                              <CalendarDays className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(index)} disabled={editingSlotIndex !== null}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </>
                      )}
                       {/* @ts-ignore TODO: fix this type error */}
                      {form.formState.errors.slots?.[index] && (Object.values(form.formState.errors.slots[index]).map( (err: any) => err?.message).filter(Boolean).length > 0) && (
                          <p className="text-xs font-medium text-destructive mt-1">
                            {/* @ts-ignore TODO: fix this type error */}
                            {Object.values(form.formState.errors.slots[index]!).map(err => typeof err === 'object' && err?.message ? err.message : '').filter(Boolean).join(', ')}
                          </p>
                      )}
                    </Card>
                  ))}
                </div>
                {fields.length > 0 && (
                  <Button type="submit" className="mt-6 w-full md:w-auto" disabled={isSubmittingGlobal || editingSlotIndex !== null}>
                    {isSubmittingGlobal && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmittingGlobal ? "Salvando Tudo..." : "Salvar Todas as Alterações"}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
