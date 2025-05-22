
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
  register: (data: Pick<User, "name" | "email" | "password"> & { condominiumId?: string }) => Promise<{ success: boolean; message: string }>;
  updateUserProfile: (data: Partial<User>) => Promise<{ success: boolean; message: string }>;
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
    await new Promise(resolve => setTimeout(resolve, 500));
    const registeredUsers = getRegisteredUsers();
    const foundUser = registeredUsers.find(
      (u) => u.email === data.email && u.password === data.password
    );

    if (foundUser) {
      if (foundUser.status === 'pending') {
        toast({
          title: "Cadastro Pendente",
          description: "Sua conta está aguardando aprovação pelo síndico.",
          variant: "destructive",
        });
        return false;
      }
      if (foundUser.status === 'denied') {
        toast({
          title: "Acesso Negado",
          description: "Seu acesso foi negado pelo síndico.",
          variant: "destructive",
        });
        return false;
      }
      // Somente status 'approved' pode logar
      if (foundUser.status !== 'approved') {
         toast({
          title: "Status Desconhecido",
          description: "O status da sua conta não permite o login. Contate o suporte.",
          variant: "destructive",
        });
        return false;
      }

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

  const register = async (data: Pick<User, "name" | "email" | "password"> & { condominiumId?: string }): Promise<{ success: boolean; message: string }> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const registeredUsers = getRegisteredUsers();

    if (registeredUsers.find((u) => u.email === data.email)) {
      return { success: false, message: "Este email já está cadastrado." };
    }

    let role: 'resident' | 'manager' = 'resident';
    let status: 'pending' | 'approved' | 'denied' = 'pending';
    const isFirstUser = registeredUsers.length === 0;

    if (isFirstUser) {
      role = 'manager';
      status = 'approved'; // Síndico é aprovado automaticamente
    }

    if (role === 'resident' && !data.condominiumId) {
      return { success: false, message: "Moradores devem selecionar um condomínio. Se nenhum estiver disponível, peça ao síndico para cadastrar." };
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: data.name,
      email: data.email,
      password: data.password, 
      role: role,
      status: status,
      registrationDate: new Date().toISOString(),
      avatarUrl: `https://placehold.co/40x40.png?text=${data.name[0]?.toUpperCase() || 'U'}`,
      dateOfBirth: "",
      apartment: "",
      cpf: "",
      phone: "",
      description: "",
      condominiumId: role === 'resident' ? data.condominiumId : undefined,
    };

    saveRegisteredUsers([...registeredUsers, newUser]);
    
    let successMessage = "Cadastro realizado com sucesso!";
    if (role === 'manager') {
      successMessage += " Você foi registrado como Síndico e sua conta está ativa.";
    } else {
      successMessage += " Seu cadastro como Morador foi recebido e está aguardando aprovação do síndico.";
    }
    successMessage += " Você será notificado sobre o status."; // Simplificação, notificação real não implementada

    return { success: true, message: successMessage };
  };

  const updateUserProfile = async (data: Partial<User>): Promise<{ success: boolean; message: string }> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    if (!user) {
      return { success: false, message: "Usuário não autenticado." };
    }

    const updatedUser = { ...user, ...data };
    setUser(updatedUser);

    const registeredUsers = getRegisteredUsers();
    const userIndex = registeredUsers.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      registeredUsers[userIndex] = updatedUser;
      saveRegisteredUsers(registeredUsers);
    }

    try {
      localStorage.setItem(AUTH_STATE_KEY, JSON.stringify({ isAuthenticated: true, user: updatedUser }));
    } catch (error) {
      console.error("Falha ao salvar o estado de autenticação atualizado no localStorage", error);
       return { success: false, message: "Erro ao salvar perfil. Tente novamente." };
    }

    return { success: true, message: "Perfil atualizado com sucesso!" };
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
    <AuthContext.Provider value={{ isAuthenticated, user, isLoading, login, logout, register, updateUserProfile, setIsAuthenticated, setUser }}>
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
