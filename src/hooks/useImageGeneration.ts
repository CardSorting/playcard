import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { generateImageTask, pollTaskStatus } from "@/services/imageGeneration";
import { storeGeneration } from "@/services/generationHistory";
import { useAuth } from "@/lib/contexts/auth-context";

const POLL_INTERVAL = 5000; // 5 seconds

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

  const handleGenerate = async (prompt: string, aspectRatio: string) => {
    if (!user) return;

    setIsGenerating(true);
    setResult({ taskId: "", status: "pending", progress: 0 });

    try {
      const taskId = await generateImageTask(prompt, aspectRatio);
      setResult({
        taskId,
        status: "pending",
        progress: 0
      });
      
      // Start polling for task status
      setTimeout(() => pollForResult(taskId, prompt, aspectRatio), POLL_INTERVAL);

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

  const pollForResult = async (taskId: string, prompt: string, aspectRatio: string) => {
    if (!user) return;

    try {
      const taskData = await pollTaskStatus(taskId);
      
      if (taskData.status === "completed") {
        const imageUrl = taskData.output.image_url;
        setResult({
          taskId,
          status: "completed",
          imageUrl,
          progress: 100
        });
        await storeGeneration(prompt, aspectRatio, imageUrl, user.uid);
        toast({
          title: "Success",
          description: "Image generated successfully!",
        });
        setIsGenerating(false);
      } else if (taskData.status === "pending") {
        setResult({
          taskId,
          status: "pending",
          progress: taskData.output?.progress || 0
        });
        setTimeout(() => pollForResult(taskId, prompt, aspectRatio), POLL_INTERVAL);
      } else {
        throw new Error("Task failed or unknown status");
      }
    } catch (error) {
      console.error("Error polling task status:", error);
      setResult({ taskId, status: "error" });
      toast({
        title: "Error",
        description: "Failed to generate image",
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