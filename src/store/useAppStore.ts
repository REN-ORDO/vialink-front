import { create } from 'zustand';

type AppState = {
  userLat: number | null;
  userLng: number | null;
  userHeading: number | null;
  userAccuracy: number | null;
  setUserLocation: (lat: number, lng: number, opts?: { heading?: number | null; accuracy?: number | null }) => void;

  selectedParaderoId: string | null;
  setSelectedParaderoId: (id: string | null) => void;

  followUser: boolean;
  setFollowUser: (v: boolean) => void;
};

export const useAppStore = create<AppState>((set) => ({
  userLat: null,
  userLng: null,
  userHeading: null,
  userAccuracy: null,
  setUserLocation: (lat, lng, opts) =>
    set({
      userLat: lat,
      userLng: lng,
      userHeading: opts?.heading ?? null,
      userAccuracy: opts?.accuracy ?? null,
    }),

  selectedParaderoId: null,
  setSelectedParaderoId: (id) => set({ selectedParaderoId: id }),

  followUser: true,
  setFollowUser: (v) => set({ followUser: v }),
}));
