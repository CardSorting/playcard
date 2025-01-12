import { CardData } from "../card-creator/types";
import { BoosterPack } from "../booster-packs/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface MarketItem {
  id: string;
  type: "card" | "pack";
  item: CardData | BoosterPack;
  price: number;
  sellerId: string;
  sellerName: string;
  createdAt: number;
}

export interface MarketFilters {
  type?: "card" | "pack" | "all";
  minPrice?: number;
  maxPrice?: number;
  pokemonType?: string;
}

export interface CartItem extends MarketItem {
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: MarketItem) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  total: number;
}

export const useCart = create<CartStore>()(
  persist<CartStore>(
    (set) => ({
      items: [],
      itemCount: 0,
      total: 0,
      addItem: (item) =>
        set((state) => {
          const existingItem = state.items.find((i) => i.id === item.id);
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i,
              ),
              itemCount: state.itemCount + 1,
              total: state.total + item.price,
            };
          }
          return {
            items: [...state.items, { ...item, quantity: 1 }],
            itemCount: state.itemCount + 1,
            total: state.total + item.price,
          };
        }),
      removeItem: (itemId) =>
        set((state) => {
          const item = state.items.find((i) => i.id === itemId);
          if (!item) return state;
          return {
            items: state.items.filter((i) => i.id !== itemId),
            itemCount: state.itemCount - item.quantity,
            total: state.total - item.price * item.quantity,
          };
        }),
      updateQuantity: (itemId, quantity) =>
        set((state) => {
          const item = state.items.find((i) => i.id === itemId);
          if (!item) return state;
          const quantityDiff = quantity - item.quantity;
          return {
            items: state.items.map((i) =>
              i.id === itemId ? { ...i, quantity } : i,
            ),
            itemCount: state.itemCount + quantityDiff,
            total: state.total + item.price * quantityDiff,
          };
        }),
      clearCart: () => set({ items: [], itemCount: 0, total: 0 }),
    }),
    {
      name: "pokemon-cart",
    },
  ),
);
