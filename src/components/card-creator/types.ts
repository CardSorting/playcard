export type PokemonType =
  | "Normal"
  | "Fire"
  | "Water"
  | "Electric"
  | "Grass"
  | "Ice"
  | "Fighting"
  | "Poison"
  | "Ground"
  | "Flying"
  | "Psychic"
  | "Bug"
  | "Rock"
  | "Ghost"
  | "Dragon"
  | "Dark"
  | "Steel"
  | "Fairy";

export type CardRarity = 
  | "Common"
  | "Uncommon"
  | "Rare"
  | "Ultra Rare"
  | "Secret Rare";

export interface CardData {
  id: string;
  name: string;
  image: string;
  type: PokemonType;
  rarity: CardRarity;
  description?: string;
  // Stats
  hp?: number;
  attack?: number;
  defense?: number;
  speed?: number;
  // Metadata
  creatorId?: string;
  createdAt?: number;
  updatedAt?: number;
  // Status
  isPublic?: boolean;
  status?: 'draft' | 'published' | 'archived';
}
