import { PokemonType } from "./types";

export const typeColors: Record<PokemonType, string> = {
  Normal: "#A8A878",
  Fire: "#F08030",
  Water: "#6890F0",
  Electric: "#F8D030",
  Grass: "#78C850",
  Ice: "#98D8D8",
  Fighting: "#C03028",
  Poison: "#A040A0",
  Ground: "#E0C068",
  Flying: "#A890F0",
  Psychic: "#F85888",
  Bug: "#A8B820",
  Rock: "#B8A038",
  Ghost: "#705898",
  Dragon: "#7038F8",
  Dark: "#705848",
  Steel: "#B8B8D0",
  Fairy: "#EE99AC",
};

export const typePatterns: Record<PokemonType, string> = {
  Normal:
    "radial-gradient(circle at 50% 50%, transparent 10%, rgba(0,0,0,0.1) 15%)",
  Fire: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 20c5.523 0 10 4.477 10 10s-4.477 10-10 10-10-4.477-10-10 4.477-10 10-10zm0 2c-4.418 0-8 3.582-8 8s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8zm0-4c7.732 0 14 6.268 14 14s-6.268 14-14 14-14-6.268-14-14 6.268-14 14-14zm0 2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12z' fill='%23000' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E\")",
  Water:
    "linear-gradient(45deg, rgba(0,0,0,0.05) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.05) 75%, rgba(0,0,0,0.05)), linear-gradient(45deg, rgba(0,0,0,0.05) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.05) 75%, rgba(0,0,0,0.05))",
  Electric:
    "linear-gradient(45deg, rgba(0,0,0,0.1) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.1) 75%, rgba(0,0,0,0.1))",
  Grass:
    "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h20v20H0V0zm10 17c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm0-1c3.314 0 6-2.686 6-6s-2.686-6-6-6-6 2.686-6 6 2.686 6 6 6z' fill='%23000' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E\")",
  Ice: "linear-gradient(135deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.1) 75%, transparent 75%, transparent)",
  Fighting:
    "repeating-linear-gradient(45deg, rgba(0,0,0,0.1) 0, rgba(0,0,0,0.1) 2px, transparent 0, transparent 4px)",
  Poison:
    "radial-gradient(circle at 50% 50%, rgba(0,0,0,0.1) 1px, transparent 1px)",
  Ground:
    "repeating-linear-gradient(45deg, rgba(0,0,0,0.1), rgba(0,0,0,0.1) 10px, transparent 10px, transparent 20px)",
  Flying:
    "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 0l10 20H0L10 0z' fill='%23000' fill-opacity='0.1'/%3E%3C/svg%3E\")",
  Psychic:
    "radial-gradient(circle at 50% 50%, rgba(0,0,0,0.1) 1px, transparent 1px), radial-gradient(circle at 50% 50%, rgba(0,0,0,0.1) 1px, transparent 1px)",
  Bug: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 0l10 10-10 10L0 10z' fill='%23000' fill-opacity='0.1'/%3E%3C/svg%3E\")",
  Rock: "repeating-conic-gradient(rgba(0,0,0,0.1) 0% 25%, transparent 0% 50%)",
  Ghost:
    "radial-gradient(circle at 50% 50%, rgba(0,0,0,0.1) 0%, transparent 50%)",
  Dragon:
    "repeating-linear-gradient(-45deg, rgba(0,0,0,0.1), rgba(0,0,0,0.1) 5px, transparent 5px, transparent 10px)",
  Dark: "repeating-radial-gradient(rgba(0,0,0,0.1) 0 1px, transparent 1px 2px)",
  Steel:
    "linear-gradient(45deg, rgba(0,0,0,0.1) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.1) 75%, rgba(0,0,0,0.1)), linear-gradient(-45deg, rgba(0,0,0,0.1) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.1) 75%, rgba(0,0,0,0.1))",
  Fairy:
    "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.2) 1px, transparent 1px), radial-gradient(circle at 0% 0%, rgba(255,255,255,0.2) 1px, transparent 1px)",
};
