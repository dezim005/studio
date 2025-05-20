
"use client";

import type { User } from "@/types";
import { useRouter } from "next/navigation";
import type { Dispatch, ReactNode, SetStateAction} from "react";
import React, { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (data: { email: string; name?: string }) => Promise<void>;
  logout: () => void;
  setIsAuthenticated: Dispatch<SetStateAction<boolean>>;
  setUser: Dispatch<SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data, replace with actual data fetching in a real app
const MOCK_USER: User = {
  id: "user1",
  name: "Resident User",
  email: "resident@example.com",
  role: "resident",
  avatarUrl: "https://placehold.co/40x40.png",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedAuth = localStorage.getItem("vagaLivreAuth");
      if (storedAuth) {
        const authData = JSON.parse(storedAuth);
        if (authData.isAuthenticated && authData.user) {
          setIsAuthenticated(true);
          setUser(authData.user);
        }
      }
    } catch (error) {
      console.error("Failed to load auth state from localStorage", error);
      // Clear potentially corrupted storage
      localStorage.removeItem("vagaLivreAuth");
    }
    setIsLoading(false);
  }, []);

  const login = async (data: { email: string; name?: string }) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    const loggedInUser: User = {
      ...MOCK_USER,
      email: data.email,
      name: data.name || MOCK_USER.name, // Use provided name or default
    };
    setIsAuthenticated(true);
    setUser(loggedInUser);
    try {
      localStorage.setItem("vagaLivreAuth", JSON.stringify({ isAuthenticated: true, user: loggedInUser }));
    } catch (error) {
      console.error("Failed to save auth state to localStorage", error);
    }
    router.push("/"); // Redirect to dashboard after login
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    try {
      localStorage.removeItem("vagaLivreAuth");
    } catch (error) {
      console.error("Failed to remove auth state from localStorage", error);
    }
    router.push("/login"); // Redirect to login page after logout
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isLoading, login, logout, setIsAuthenticated, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
