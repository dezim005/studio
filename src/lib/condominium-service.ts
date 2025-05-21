
"use client";

import type { Condominium } from "@/types";

const CONDOMINIUMS_STORAGE_KEY = "vagaLivreCondominiums";

export function getCondominiums(): Condominium[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const storedCondominiums = localStorage.getItem(CONDOMINIUMS_STORAGE_KEY);
    return storedCondominiums ? JSON.parse(storedCondominiums) : [];
  } catch (error) {
    console.error("Falha ao carregar condomínios do localStorage", error);
    return [];
  }
}

export function addCondominium(condominiumData: Omit<Condominium, 'id'>): Condominium {
  const condominiums = getCondominiums();
  const newCondominium: Condominium = {
    id: `condo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    ...condominiumData,
  };
  const updatedCondominiums = [...condominiums, newCondominium];
  try {
    localStorage.setItem(CONDOMINIUMS_STORAGE_KEY, JSON.stringify(updatedCondominiums));
  } catch (error) {
    console.error("Falha ao salvar condomínio no localStorage", error);
    // Poderia lançar o erro ou retornar null/undefined dependendo da política de erro
  }
  return newCondominium;
}

export function getCondominiumById(id: string): Condominium | undefined {
  const condominiums = getCondominiums();
  return condominiums.find(condo => condo.id === id);
}
