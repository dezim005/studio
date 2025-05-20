
"use client";

import * as React from "react";
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
import { ParkingSquare } from "lucide-react";

const spotRegistrationSchema = z.object({
  spotNumber: z.string().min(1, "Spot number is required"),
  spotType: z.enum(["compact", "standard", "suv", "motorcycle"], {
    required_error: "Spot type is required.",
  }),
  locationDetails: z.string().min(5, "Location details must be at least 5 characters"),
  additionalNotes: z.string().optional(),
});

type SpotRegistrationFormValues = z.infer<typeof spotRegistrationSchema>;

export function SpotRegistrationForm() {
  const { toast } = useToast();
  const form = useForm<SpotRegistrationFormValues>({
    resolver: zodResolver(spotRegistrationSchema),
    defaultValues: {
      spotNumber: "",
      locationDetails: "",
      additionalNotes: "",
    },
  });

  async function onSubmit(data: SpotRegistrationFormValues) {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Spot registration data:", data);
    toast({
      title: "Spot Registered!",
      description: `Spot ${data.spotNumber} has been successfully registered.`,
      variant: "default"
    });
    form.reset();
    // Potentially redirect or update UI state
    // router.push('/my-spots'); 
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center">
          <ParkingSquare className="mr-2 h-6 w-6 text-primary" />
          Register a New Parking Spot
        </CardTitle>
        <CardDescription>
          Provide the details of your parking spot to make it available for others.
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
                  <FormLabel>Spot Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., A01, 12B" {...field} />
                  </FormControl>
                  <FormDescription>
                    The unique identifier for your parking spot.
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
                  <FormLabel>Spot Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a spot type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="compact">Compact</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="suv">SUV / Large</SelectItem>
                      <SelectItem value="motorcycle">Motorcycle</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the type that best describes your parking spot.
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
                  <FormLabel>Location Details</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Level 2, near the north elevator, covered"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Be specific about the location to help others find it easily.
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
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Spot is narrow, EV charging available nearby"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                   <FormDescription>
                    Any other relevant information about the spot.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full sm:w-auto" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Registering..." : "Register Spot"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
