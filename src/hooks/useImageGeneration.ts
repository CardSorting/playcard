import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { generateImageTask } from "@/services/imageGeneration";
import { FirebaseImageService } from "@/services/image-generation/firebase";
import { getSystemToken } from "@server/lib/firebase-admin";
import { storeGeneration } from "@/services/generationHistory";
import { useAuth } from "@/lib/contexts/auth-context";

interface GenerationResult {
  taskId: string;
  imageUrl?: string;
  status: "pending" | "processing" | "completed" | "failed";
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
      const generationResult = await generateImageTask({
        prompt,
        aspectRatio,
        processMode
      });
      
      if (!generationResult?.task_id) {
        throw new Error("Failed to start image generation");
      }

      setResult({
        taskId: generationResult.task_id,
        status: "pending",
        progress: 0
      });

      const imageService = new FirebaseImageService();

      // Subscribe to task updates
      const unsubscribe = imageService.subscribeToTaskUpdates(
        generationResult.task_id,
        user.uid,
        (task: any) => {
          setResult({
            taskId: task.id,
            status: task.status,
            progress: task.progress,
            imageUrl: task.imageUrls?.main
          });

          if (task.status === "completed") {
            storeGeneration(prompt, aspectRatio, {
              main: task.imageUrls?.main || '',
              variants: task.imageUrls?.variants || [],
              temporary: task.imageUrls?.temporary || [],
              discord: task.imageUrls?.discord || ''
            }, user.uid);
            toast({
              title: "Success",
              description: "Image generated successfully!",
            });
            setIsGenerating(false);
            unsubscribe(); // No arguments needed
          } else if (task.status === "failed") {
            toast({
              title: "Error",
              description: "Failed to generate image",
              variant: "destructive",
            });
            setIsGenerating(false);
            unsubscribe(); // No arguments needed
          }
        }
      );

    } catch (error) {
      console.error("Error generating image:", error);
      setResult({ taskId: "", status: "failed" });
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
