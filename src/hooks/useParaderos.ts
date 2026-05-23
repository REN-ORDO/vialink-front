import { useQuery } from '@tanstack/react-query';
import { api, ApiError } from '../lib/api';
import { paraderosMock } from '../lib/mockData';
import type { Paradero } from '../types';

async function fetchParaderos(): Promise<Paradero[]> {
  try {
    return await api<Paradero[]>('/paraderos');
  } catch (err) {
    if (err instanceof ApiError || err instanceof TypeError) {
      return paraderosMock;
    }
    throw err;
  }
}

export function useParaderos() {
  return useQuery({
    queryKey: ['paraderos'],
    queryFn: fetchParaderos,
    staleTime: 60_000,
  });
}

async function fetchParadero(id: string): Promise<Paradero> {
  try {
    return await api<Paradero>(`/paraderos/${id}`);
  } catch (err) {
    if (err instanceof ApiError || err instanceof TypeError) {
      const found = paraderosMock.find((p) => p.id === id);
      if (!found) throw new Error(`Paradero ${id} no encontrado`);
      return found;
    }
    throw err;
  }
}

export function useParadero(id: string | undefined) {
  return useQuery({
    queryKey: ['paradero', id],
    queryFn: () => fetchParadero(id!),
    enabled: !!id,
    staleTime: 30_000,
  });
}
