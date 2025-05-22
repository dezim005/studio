
"use client";

import type { User } from "@/types";

const REGISTERED_USERS_KEY = "vagaLivreRegisteredUsers";

export function getUsers(): User[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const users = localStorage.getItem(REGISTERED_USERS_KEY);
    return users ? JSON.parse(users) : [];
  } catch (error) {
    console.error("Falha ao carregar usuários do localStorage", error);
    return [];
  }
}

export function getUserById(id: string): User | undefined {
  const users = getUsers();
  return users.find(user => user.id === id);
}

export function updateUser(userId: string, data: Partial<User>): User | undefined {
  let users = getUsers();
  const userIndex = users.findIndex(user => user.id === userId);

  if (userIndex !== -1) {
    users[userIndex] = { ...users[userIndex], ...data };
    try {
      localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
      
      const authState = localStorage.getItem("vagaLivreAuth");
      if (authState) {
        const authData = JSON.parse(authState);
        if (authData.user && authData.user.id === userId) {
          authData.user = { ...authData.user, ...data };
          localStorage.setItem("vagaLivreAuth", JSON.stringify(authData));
        }
      }
      return users[userIndex];
    } catch (error) {
      console.error("Falha ao salvar usuários atualizados no localStorage", error);
      return undefined;
    }
  }
  return undefined;
}

export function deleteUser(userId: string): boolean {
  let users = getUsers();
  const initialLength = users.length;
  users = users.filter(user => user.id !== userId);

  if (users.length < initialLength) {
    try {
      localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
      // Se o usuário excluído for o logado, limpar também o estado de autenticação
      const authState = localStorage.getItem("vagaLivreAuth");
      if (authState) {
        const authData = JSON.parse(authState);
        if (authData.user && authData.user.id === userId) {
          localStorage.removeItem("vagaLivreAuth");
        }
      }
      return true;
    } catch (error) {
      console.error("Falha ao salvar usuários após exclusão no localStorage", error);
      return false;
    }
  }
  return false; // Usuário não encontrado
}
