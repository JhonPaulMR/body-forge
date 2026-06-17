import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SettingsState {
  // Treino
  defaultRestTime: number; // segundos
  weightIncrement: number; // kg
  defaultSets: number; // séries padrão

  // Aplicativo
  weightUnit: 'kg' | 'lbs';
  measurementUnit: 'cm' | 'in';

  // Notificações
  restTimerEnabled: boolean;
  restTimerVibration: boolean;
  restTimerSound: boolean;
  dailyReminders: boolean;

  // Ações
  setDefaultRestTime: (seconds: number) => void;
  setWeightIncrement: (kg: number) => void;
  setDefaultSets: (sets: number) => void;
  setWeightUnit: (unit: 'kg' | 'lbs') => void;
  setMeasurementUnit: (unit: 'cm' | 'in') => void;
  toggleRestTimerEnabled: () => void;
  toggleRestTimerVibration: () => void;
  toggleRestTimerSound: () => void;
  toggleDailyReminders: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      defaultRestTime: 60,
      weightIncrement: 2.5,
      defaultSets: 3,
      weightUnit: 'kg',
      measurementUnit: 'cm',
      restTimerEnabled: true,
      restTimerVibration: true,
      restTimerSound: true,
      dailyReminders: true,

      setDefaultRestTime: (seconds) => set({ defaultRestTime: seconds }),
      setWeightIncrement: (kg) => set({ weightIncrement: kg }),
      setDefaultSets: (sets) => set({ defaultSets: sets }),
      setWeightUnit: (unit) => set({ weightUnit: unit }),
      setMeasurementUnit: (unit) => set({ measurementUnit: unit }),
      toggleRestTimerEnabled: () => set((state) => ({ restTimerEnabled: !state.restTimerEnabled })),
      toggleRestTimerVibration: () => set((state) => ({ restTimerVibration: !state.restTimerVibration })),
      toggleRestTimerSound: () => set((state) => ({ restTimerSound: !state.restTimerSound })),
      toggleDailyReminders: () => set((state) => ({ dailyReminders: !state.dailyReminders })),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
