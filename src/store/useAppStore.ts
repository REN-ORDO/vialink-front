import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type AppState = {
  userLat: number | null;
  userLng: number | null;
  userHeading: number | null;
  userAccuracy: number | null;
  /** Epoch ms del último fix GPS exitoso. null si nunca tuvimos uno. */
  userLocationAt: number | null;
  setUserLocation: (
    lat: number,
    lng: number,
    opts?: { heading?: number | null; accuracy?: number | null },
  ) => void;
  clearUserLocation: () => void;

  selectedParaderoId: string | null;
  setSelectedParaderoId: (id: string | null) => void;

  followUser: boolean;
  setFollowUser: (v: boolean) => void;
};

/**
 * Store global. La location (lat/lng/heading/accuracy + timestamp) se
 * PERSISTE en localStorage para que al recargar la pantalla, el marker
 * del usuario aparezca instantáneamente con el último fix conocido,
 * mientras GPS hace su trabajo en background.
 *
 * Solo persistimos location — `selectedParaderoId` y `followUser` son
 * estado de sesión que debe arrancar limpio en cada carga.
 */
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      userLat: null,
      userLng: null,
      userHeading: null,
      userAccuracy: null,
      userLocationAt: null,
      setUserLocation: (lat, lng, opts) =>
        set({
          userLat: lat,
          userLng: lng,
          userHeading: opts?.heading ?? null,
          userAccuracy: opts?.accuracy ?? null,
          userLocationAt: Date.now(),
        }),
      clearUserLocation: () =>
        set({
          userLat: null,
          userLng: null,
          userHeading: null,
          userAccuracy: null,
          userLocationAt: null,
        }),

      selectedParaderoId: null,
      setSelectedParaderoId: (id) => set({ selectedParaderoId: id }),

      followUser: true,
      setFollowUser: (v) => set({ followUser: v }),
    }),
    {
      name: 'vialink-app-state',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Solo persistimos la location. El resto es estado de sesión.
      partialize: (state) => ({
        userLat: state.userLat,
        userLng: state.userLng,
        userHeading: state.userHeading,
        userAccuracy: state.userAccuracy,
        userLocationAt: state.userLocationAt,
      }),
    },
  ),
);
