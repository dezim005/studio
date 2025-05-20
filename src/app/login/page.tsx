
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const loginFormSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters").min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function LoginPage() {
  const { login, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  React.useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      router.push("/"); // Redirect to dashboard if already logged in
    }
  }, [isAuthenticated, isAuthLoading, router]);

  async function onSubmit(data: LoginFormValues) {
    setIsSubmitting(true);
    try {
      // In a real app, the name might come from user profile after email/pass auth
      // For this prototype, we'll use a default or derive it if needed.
      await login({ email: data.email });
      // Successful login will redirect via AuthContext's login method
    } catch (error) {
      console.error("Login failed:", error);
      // Handle login errors (e.g., display a toast message)
      form.setError("root", { type: "manual", message: "Login failed. Please check your credentials."})
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isAuthLoading || (!isAuthLoading && isAuthenticated)) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-8">
        <Logo />
      </div>
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome Back!</CardTitle>
          <CardDescription>Enter your credentials to access Vaga Livre.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="user@example.com" {...field} />
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.formState.errors.root && (
                  <p className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</p>
              )}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSubmitting ? "Logging in..." : "Login"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Vaga Livre. All rights reserved.
      </p>
    </div>
  );
}
