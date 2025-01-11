import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CardData, PokemonType } from "./types";
import TypeIcon from "./TypeIcon";
import { typeColors } from "./typeColors";

interface Props {
  data: Partial<CardData>;
  onChange: (data: Partial<CardData>) => void;
}

const pokemonTypes: PokemonType[] = [
  "Normal",
  "Fire",
  "Water",
  "Electric",
  "Grass",
  "Ice",
  "Fighting",
  "Poison",
  "Ground",
  "Flying",
  "Psychic",
  "Bug",
  "Rock",
  "Ghost",
  "Dragon",
  "Dark",
  "Steel",
  "Fairy",
];

export default function CardForm({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-white">
          Pokemon Name
        </Label>
        <Input
          id="name"
          placeholder="Enter Pokemon name"
          value={data.name || ""}
          onChange={(e) => onChange({ ...data, name: e.target.value })}
          className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type" className="text-white">
          Pokemon Type
        </Label>
        <Select
          value={data.type}
          onValueChange={(value: PokemonType) =>
            onChange({ ...data, type: value })
          }
        >
          <SelectTrigger
            id="type"
            className="bg-white/5 border-gray-700 text-white"
          >
            <SelectValue placeholder="Select Type" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <div className="grid grid-cols-2 gap-1 p-1">
              {pokemonTypes.map((type) => (
                <SelectItem
                  key={type}
                  value={type}
                  className="rounded hover:bg-gray-100"
                >
                  <div
                    className="flex items-center gap-2 p-1 rounded transition-colors"
                    style={{
                      backgroundColor: `${typeColors[type]}10`,
                    }}
                  >
                    <TypeIcon type={type} className="w-6 h-6" />
                    <span>{type}</span>
                  </div>
                </SelectItem>
              ))}
            </div>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
