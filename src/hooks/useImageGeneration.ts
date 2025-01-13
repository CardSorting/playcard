import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { generateImageTask, subscribeToTaskUpdates } from "@/services/imageGeneration";
import { storeGeneration } from "@/services/generationHistory";
import { useAuth } from "@/lib/contexts/auth-context";

interface GenerationResult {
  taskId: string;
  imageUrl?: string;
  status: "pending" | "completed" | "error";
  progress?: number;
}

export default function useImageGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleGenerate = async (prompt: string, aspectRatio: string, processMode: 'relax' | 'fast' | 'turbo' = 'fast') => {
    if (!user) return;

    setIsGenerating(true);
    setResult({ taskId: "", status: "pending", progress: 0 });

    try {
      const generationResult = await generateImageTask(prompt, aspectRatio, processMode);
      
      if (!generationResult?.task_id) {
        throw new Error("Failed to start image generation");
      }

      setResult({
        taskId: generationResult.task_id,
        status: "pending",
        progress: 0
      });

      // Subscribe to task updates
      const unsubscribe = subscribeToTaskUpdates(generationResult.task_id, (task) => {
        setResult({
          taskId: task.id,
          status: task.status,
          progress: task.progress,
          imageUrl: task.imageUrl
        });

        if (task.status === "completed") {
          storeGeneration(prompt, aspectRatio, {
            main: task.imageUrl || '',
            variants: [],
            temporary: [],
            discord: ''
          }, user.uid);
          toast({
            title: "Success",
            description: "Image generated successfully!",
          });
          setIsGenerating(false);
          unsubscribe();
        } else if (task.status === "error") {
          toast({
            title: "Error",
            description: "Failed to generate image",
            variant: "destructive",
          });
          setIsGenerating(false);
          unsubscribe();
        }
      });

    } catch (error) {
      console.error("Error generating image:", error);
      setResult({ taskId: "", status: "error" });
      toast({
        title: "Error",
        description: "Failed to start image generation",
        variant: "destructive",
      });
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    result,
    handleGenerate,
  };
}
