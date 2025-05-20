
"use client";

import type { User } from "@/types";
import { useRouter } from "next/navigation";
import type { Dispatch, ReactNode, SetStateAction} from "react";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (data: Pick<User, "email" | "password">) => Promise<boolean>;
  logout: () => void;
  register: (data: Pick<User, "name" | "email" | "password">) => Promise<{ success: boolean; message: string }>;
  setIsAuthenticated: Dispatch<SetStateAction<boolean>>;
  setUser: Dispatch<SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const REGISTERED_USERS_KEY = "vagaLivreRegisteredUsers";
const AUTH_STATE_KEY = "vagaLivreAuth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedAuth = localStorage.getItem(AUTH_STATE_KEY);
      if (storedAuth) {
        const authData = JSON.parse(storedAuth);
        if (authData.isAuthenticated && authData.user) {
          setIsAuthenticated(true);
          setUser(authData.user);
        }
      }
    } catch (error) {
      console.error("Falha ao carregar o estado de autenticação do localStorage", error);
      localStorage.removeItem(AUTH_STATE_KEY);
    }
    setIsLoading(false);
  }, []);

  const getRegisteredUsers = (): User[] => {
    try {
      const users = localStorage.getItem(REGISTERED_USERS_KEY);
      return users ? JSON.parse(users) : [];
    } catch (error) {
      console.error("Falha ao carregar usuários registrados do localStorage", error);
      return [];
    }
  };

  const saveRegisteredUsers = (users: User[]) => {
    try {
      localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
    } catch (error) {
      console.error("Falha ao salvar usuários registrados no localStorage", error);
    }
  };

  const login = async (data: Pick<User, "email" | "password">): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simular atraso da API
    const registeredUsers = getRegisteredUsers();
    const foundUser = registeredUsers.find(
      (u) => u.email === data.email && u.password === data.password
    );

    if (foundUser) {
      setIsAuthenticated(true);
      setUser(foundUser);
      try {
        localStorage.setItem(AUTH_STATE_KEY, JSON.stringify({ isAuthenticated: true, user: foundUser }));
      } catch (error) {
        console.error("Falha ao salvar o estado de autenticação no localStorage", error);
      }
      router.push("/");
      return true;
    } else {
      toast({
        title: "Falha no Login",
        description: "Email ou senha inválidos.",
        variant: "destructive",
      });
      return false;
    }
  };

  const register = async (data: Pick<User, "name" | "email" | "password">): Promise<{ success: boolean; message: string }> => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simular atraso da API
    const registeredUsers = getRegisteredUsers();
    
    if (registeredUsers.find((u) => u.email === data.email)) {
      return { success: false, message: "Este email já está cadastrado." };
    }

    let role: 'resident' | 'manager' = 'resident';
    if (registeredUsers.length === 0) {
      role = 'manager'; // O primeiro usuário registrado é o síndico/manager
    }

    const newUser: User = {
      id: `user${Date.now()}`, // Gerar ID simples
      name: data.name,
      email: data.email,
      password: data.password, // Lembre-se: NÃO FAÇA ISSO EM PRODUÇÃO!
      role: role, 
      avatarUrl: `https://placehold.co/40x40.png?text=${data.name[0].toUpperCase()}`, // Avatar placeholder
    };

    saveRegisteredUsers([...registeredUsers, newUser]);
    const roleMessage = role === 'manager' ? "Você foi registrado como Síndico." : "Você foi registrado como Morador.";
    return { success: true, message: `Cadastro realizado com sucesso! ${roleMessage} Você pode fazer login agora.` };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    try {
      localStorage.removeItem(AUTH_STATE_KEY);
    } catch (error) {
      console.error("Falha ao remover o estado de autenticação do localStorage", error);
    }
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isLoading, login, logout, register, setIsAuthenticated, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
