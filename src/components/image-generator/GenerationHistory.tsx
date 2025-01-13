import { Button } from "@/components/ui/button";
import { History } from "lucide-react";

interface Generation {
  id: string;
  prompt: string;
  imageUrl: string;
  createdAt: Date;
}

interface GenerationHistoryProps {
  generations: Generation[];
  onClose: () => void;
}

export function GenerationHistory({ generations, onClose }: GenerationHistoryProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Button
          variant="ghost"
          className="text-gray-400 hover:text-white"
          onClick={onClose}
        >
          Close
        </Button>
      </div>
      <div className="space-y-4 max-h-[500px] overflow-y-auto">
        {generations.map((gen) => (
          <div
            key={gen.id}
            className="border border-gray-700 rounded-lg p-4 space-y-2"
          >
            <img
              src={gen.imageUrl}
              alt={gen.prompt}
              className="w-full h-32 object-cover rounded-lg"
            />
            <p className="text-sm text-gray-400">{gen.prompt}</p>
            <p className="text-xs text-gray-500">
              {gen.createdAt.toLocaleDateString()}
            </p>
          </div>
        ))}
        {generations.length === 0 && (
          <p className="text-gray-400 text-center py-4">
            No previous generations found
          </p>
        )}
      </div>
    </div>
  );
}