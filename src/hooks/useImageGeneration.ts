import { useState, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { generateImageTask } from "@/services/imageGeneration";
import { storeGeneration } from "@/services/generationHistory";
import { useAuth } from "@/lib/contexts/auth-context";

const INITIAL_POLL_INTERVAL = 5000; // 5 seconds
const MAX_POLL_INTERVAL = 30000; // 30 seconds
const MAX_RETRIES = 5;
const API_BASE_URL = 'http://localhost:3001';

interface GenerationResult {
  taskId: string;
  imageUrl?: string;
  imageUrls?: string[];
  status: "pending" | "completed" | "error";
  progress?: number;
}

const mapApiStatus = (apiStatus: string): "pending" | "completed" | "error" => {
  switch (apiStatus) {
    case "Completed":
      return "completed";
    case "Processing":
    case "Pending":
    case "Staged":
      return "pending";
    case "Failed":
    default:
      return "error";
  }
};

export default function useImageGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  const handleGenerate = async (prompt: string, aspectRatio: string) => {
    if (!user) return;

    setIsGenerating(true);
    setResult({ taskId: "", status: "pending", progress: 0 });
    retryCountRef.current = 0;

    try {
      const taskId = await generateImageTask(prompt, aspectRatio);
      console.log('Received task ID:', taskId);
      
      if (!validateTaskId(taskId)) {
        console.error('Invalid task ID format:', taskId);
        throw new Error("Invalid task ID received");
      }

      setResult({
        taskId,
        status: "pending",
        progress: 0
      });
      
      pollForResult(taskId, prompt, aspectRatio, INITIAL_POLL_INTERVAL);

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

  const validateTaskId = (taskId: string): boolean => {
    return typeof taskId === 'string' && taskId.trim().length > 0;
  };

  const pollForResult = async (
    taskId: string,
    prompt: string,
    aspectRatio: string,
    interval: number
  ) => {
    if (!user || !taskId) {
      cleanupPolling();
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/task-status/${taskId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch task status: ${response.statusText}`);
      }
      const taskStatus = await response.json();
      
      if (!taskStatus) {
        throw new Error("Invalid response from task status API");
      }

      setResult({
        taskId,
        status: mapApiStatus(taskStatus.status),
        imageUrl: taskStatus.imageUrl,
        imageUrls: taskStatus.imageUrls,
        progress: taskStatus.progress
      });

      if (taskStatus.status === "completed") {
        await storeGeneration(prompt, aspectRatio, taskStatus.imageUrl, user.uid);
        toast({
          title: "Success",
          description: "Image generated successfully!",
        });
        cleanupPolling();
        setIsGenerating(false);
      } else if (taskStatus.status === "pending") {
        scheduleNextPoll(taskId, prompt, aspectRatio, interval);
      } else {
        throw new Error(
          taskStatus.error || 
          `Task failed with status: ${taskStatus.status}`
        );
      }
    } catch (error) {
      console.error("Error polling task status:", {
        taskId,
        error: error.message,
        stack: error.stack,
        response: {
          status: error.response?.status,
          data: error.response?.data
        }
      });

      if (error.message === "Invalid response from task status API" || error.response?.status === 400 || error.response?.status === 404) {
        retryCountRef.current++;
        if (retryCountRef.current >= MAX_RETRIES) {
          console.error("Max retries reached for task:", taskId);
          setResult({ taskId, status: "error" });
          toast({
            title: "Error",
            description: `Failed to generate image: ${error.message}`,
            variant: "destructive",
          });
          cleanupPolling();
          setIsGenerating(false);
          return;
        }
        
        // Exponential backoff for retries
        const nextInterval = Math.min(interval * 2, MAX_POLL_INTERVAL);
        scheduleNextPoll(taskId, prompt, aspectRatio, nextInterval);
      } else {
        setResult({ taskId, status: "error" });
        toast({
          title: "Error",
          description: `Failed to generate image: ${error.message}`,
          variant: "destructive",
        });
        cleanupPolling();
        setIsGenerating(false);
      }
    }
  };

  const scheduleNextPoll = (
    taskId: string,
    prompt: string,
    aspectRatio: string,
    interval: number
  ) => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
    }
    pollTimeoutRef.current = setTimeout(
      () => pollForResult(taskId, prompt, aspectRatio, interval),
      interval
    );
  };

  const cleanupPolling = () => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  };

  return {
    isGenerating,
    result,
    handleGenerate,
  };
}
