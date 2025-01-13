import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { cn } from "@/lib/utils";

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
  const [textareaHeight, setTextareaHeight] = useState("auto");
  const [isFocused, setIsFocused] = useState(false);
  const maxLength = 500;

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length <= maxLength) {
      onPromptChange(e.target.value);
    }
  };

  useEffect(() => {
    const textarea = document.getElementById("prompt-textarea");
    if (textarea) {
      textarea.style.height = "auto";
      const newHeight = Math.min(textarea.scrollHeight, 200);
      textarea.style.height = `${newHeight}px`;
      setTextareaHeight(`${newHeight}px`);
    }
  }, [prompt]);

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <Label htmlFor="prompt-textarea">Prompt</Label>
            <span className={cn(
              "text-sm",
              prompt.length > maxLength * 0.9 ? "text-red-400" : "text-gray-400"
            )}>
              {prompt.length}/{maxLength}
            </span>
          </div>
          <Textarea
            id="prompt-textarea"
            placeholder="Describe the image you want to generate..."
            value={prompt}
            onChange={handlePromptChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              "bg-white/5 border-gray-700 text-white min-h-[120px] resize-none transition-all duration-300",
              isFocused ? "ring-2 ring-yellow-400/50" : ""
            )}
            style={{ height: textareaHeight }}
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
            disabled={!prompt || isGenerating || prompt.length > maxLength}
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