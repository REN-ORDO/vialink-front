import { create } from 'zustand';

type AppState = {
  userLat: number | null;
  userLng: number | null;
  setUserLocation: (lat: number, lng: number) => void;

  selectedParaderoId: string | null;
  setSelectedParaderoId: (id: string | null) => void;
};

export const useAppStore = create<AppState>((set) => ({
  userLat: null,
  userLng: null,
  setUserLocation: (lat, lng) => set({ userLat: lat, userLng: lng }),

  selectedParaderoId: null,
  setSelectedParaderoId: (id) => set({ selectedParaderoId: id }),
}));
