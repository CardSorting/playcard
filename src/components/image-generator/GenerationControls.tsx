import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ImageIcon, History } from "lucide-react";
import ExamplePrompts from "./ExamplePrompts";

interface GenerationControlsProps {
  prompt: string;
  aspectRatio: string;
  isGenerating: boolean;
  showHistory: boolean;
  onPromptChange: (prompt: string) => void;
  onAspectRatioChange: (aspectRatio: string) => void;
  onGenerate: () => void;
  onToggleHistory: () => void;
}

export function GenerationControls({
  prompt,
  aspectRatio,
  isGenerating,
  showHistory,
  onPromptChange,
  onAspectRatioChange,
  onGenerate,
  onToggleHistory,
}: GenerationControlsProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="prompt">Prompt</Label>
          <Input
            id="prompt"
            placeholder="Describe the image you want to generate..."
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            className="bg-white/5 border-gray-700 text-white"
          />
        </div>

        <ExamplePrompts onSelectExample={onPromptChange} />
        
        <div className="space-y-2">
          <Label>Aspect Ratio</Label>
          <Select value={aspectRatio} onValueChange={onAspectRatioChange}>
            <SelectTrigger className="bg-white/5 border-gray-700 text-white">
              <SelectValue placeholder="Select aspect ratio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="16:9">16:9 - Landscape</SelectItem>
              <SelectItem value="4:3">4:3 - Standard</SelectItem>
              <SelectItem value="1:1">1:1 - Square</SelectItem>
              <SelectItem value="9:16">9:16 - Portrait</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-4">
          <Button
            className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black"
            onClick={onGenerate}
            disabled={!prompt || isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4 mr-2" />
                Generate Image
              </>
            )}
          </Button>

          <Button
            variant="outline"
            className="bg-white/5 border-gray-700 text-white hover:bg-white/10"
            onClick={onToggleHistory}
          >
            <History className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}