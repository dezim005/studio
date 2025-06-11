
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
import { addDays, format, startOfDay, endOfDay } from "date-fns";
import { ptBR } from 'date-fns/locale';
import type { DateRange } from "react-day-picker";
import { CalendarDays, Repeat, Trash2, PlusCircle, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"; // Adicionado

// Schema para um único slot de disponibilidade no formulário
const formAvailabilitySlotSchema = z.object({
  id: z.string().optional(), // Usado para manter rastreamento dos slots existentes
  dateRange: z.object({
    from: z.date({ required_error: "Data de início é obrigatória." }),
    to: z.date().optional(),
  }),
  isRecurring: z.boolean().default(false),
  recurrencePattern: z.enum(["daily", "weekly", "monthly"]).optional(),
});
// Removida a validação de tempo e a checagem de endTime > startTime baseada em horas


const formSchema = z.object({
  slots: z.array(formAvailabilitySlotSchema)
});

type AvailabilityFormValues = z.infer<typeof formSchema>;

interface SpotAvailabilityCalendarProps {
  spot: ParkingSpot;
  onSave: (availabilitySlots: AvailabilitySlot[]) => Promise<void>;
}

export function SpotAvailabilityCalendar({ spot, onSave }: SpotAvailabilityCalendarProps) {
  const { toast } = useToast();
  const [selectedDateRange, setSelectedDateRange] = React.useState<DateRange | undefined>({
    from: startOfDay(new Date()),
    to: startOfDay(addDays(new Date(), 0)),
  });
  const [isSubmittingGlobal, setIsSubmittingGlobal] = React.useState(false);

  const form = useForm<AvailabilityFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      slots: spot.availability?.map(slot => ({
        id: slot.id,
        dateRange: { 
          from: startOfDay(new Date(slot.startTime)), 
          to: startOfDay(new Date(slot.endTime)) // endTime do slot já é endOfDay
        },
        isRecurring: slot.isRecurring,
        recurrencePattern: slot.recurrencePattern,
      })) || [],
    },
  });
  
  React.useEffect(() => {
    form.reset({
      slots: spot.availability?.map(slot => ({
        id: slot.id,
        dateRange: { 
          from: startOfDay(new Date(slot.startTime)), 
          to: startOfDay(new Date(slot.endTime)) // endTime do slot já é endOfDay
        },
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
    const processedSlots: AvailabilitySlot[] = data.slots.map((formSlot, index) => {
      const fromDate = startOfDay(formSlot.dateRange.from);
      const toDate = endOfDay(formSlot.dateRange.to || formSlot.dateRange.from); 
      
      return {
        id: formSlot.id || `new-${Date.now()}-${index}`,
        spotId: spot.id,
        startTime: fromDate, // startTime é startOfDay do primeiro dia
        endTime: toDate,     // endTime é endOfDay do último dia
        isRecurring: formSlot.isRecurring,
        recurrencePattern: formSlot.isRecurring ? formSlot.recurrencePattern : undefined,
      };
    });
    
    await onSave(processedSlots);
    setEditingSlotIndex(null);
    setIsSubmittingGlobal(false);
  }
  
  const handleAddNewSlot = () => {
    if (!selectedDateRange?.from) {
      toast({ title: "Selecione a Data", description: "Por favor, selecione uma data ou período primeiro.", variant: "destructive"});
      return;
    }
    const newSlotBase = {
      id: `temp-${Date.now()}`,
      dateRange: { 
        from: startOfDay(selectedDateRange.from), 
        to: selectedDateRange.to ? startOfDay(selectedDateRange.to) : startOfDay(selectedDateRange.from) 
      },
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
         form.setValue(`slots.${index}.dateRange.to`, undefined, { shouldValidate: true });
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
          Defina quais dias sua vaga de estacionamento está disponível para reservas. Selecione datas no calendário e adicione intervalos.
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
                  <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Novo Intervalo de Dias
                </Button>
              </div>

              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold mb-3">Dias Disponíveis</h3>
                {fields.length === 0 && (
                  <p className="text-muted-foreground text-sm">Nenhum intervalo definido. Selecione as datas e clique em "Adicionar Novo Intervalo de Dias".</p>
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
                          {/* Campos de Hora Removidos */}
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
                          {/* Exibição de Horas Removida */}
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
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditSlot(index)} disabled={editingSlotIndex !== null && editingSlotIndex !== index}>
                                  <CalendarDays className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Editar Datas do Intervalo</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(index)} disabled={editingSlotIndex !== null}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Remover Intervalo</p>
                              </TooltipContent>
                            </Tooltip>
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
