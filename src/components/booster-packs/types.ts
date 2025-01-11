import { CardData } from "../card-creator/types";

export interface BoosterPack {
  id: string;
  name: string;
  cards: CardData[];
  createdAt: number;
}
