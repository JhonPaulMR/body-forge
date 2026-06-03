import { create } from 'zustand';

interface NavbarState {
  isVisible: boolean;
  setVisible: (visible: boolean) => void;
}

export const useNavbarStore = create<NavbarState>((set) => ({
  isVisible: true,
  setVisible: (visible) => set({ isVisible: visible }),
}));
