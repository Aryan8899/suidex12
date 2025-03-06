// @ts-nocheck

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface Token {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  metadata?: {
    name: string;
    symbol: string;
    image?: string;
    decimals: number;
  };
}

interface TokenSelectionState {
  selectedTokens: {
    token0: Token | null;
    token1: Token | null;
  };
  selectionCount: number;
  setToken: (token: Token) => void;
  resetTokens: () => void;
  swapTokens: () => void;
}

export const useTokenStore = create<TokenSelectionState>()(
  devtools(
    persist(
      (set) => ({
        selectedTokens: {
          token0: null,
          token1: null,
        },
        selectionCount: 0,
        setToken: (token) =>
          set((state) => {
            const newCount = (state.selectionCount + 1) % 3;
            const newTokens = { ...state.selectedTokens };

            if (newCount === 1) {
              newTokens.token0 = token;
            } else if (newCount === 2) {
              newTokens.token1 = token;
            }

            return {
              selectedTokens: newTokens,
              selectionCount: newCount,
            };
          }),
        resetTokens: () =>
          set({
            selectedTokens: { token0: null, token1: null },
            selectionCount: 0,
          }),
        swapTokens: () =>
          set((state) => ({
            selectedTokens: {
              token0: state.selectedTokens.token1,
              token1: state.selectedTokens.token0,
            },
          })),
      }),
      {
        name: "token-selection-store",
      }
    )
  )
);
