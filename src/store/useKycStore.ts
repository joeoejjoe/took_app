import { create } from 'zustand';

type KycStatus = 'none' | 'pending' | 'verified' | 'rejected';

interface KycState {
  status: KycStatus;
  submittedAt: string | null;
  setStatus: (status: KycStatus) => void;
  submitKyc: () => void;
  reset: () => void;
}

export const useKycStore = create<KycState>((set) => ({
  status: 'none',
  submittedAt: null,
  setStatus: (status: KycStatus) => set({ status }),
  submitKyc: () =>
    set({
      status: 'pending',
      submittedAt: new Date().toISOString(),
    }),
  reset: () => set({ status: 'none', submittedAt: null }),
}));
