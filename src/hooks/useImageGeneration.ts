import { useState, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { generateImageTask } from "@/services/imageGeneration";
import { storeGeneration } from "@/services/generationHistory";
import { useAuth } from "@/lib/contexts/auth-context";

const INITIAL_POLL_INTERVAL = 5000; // 5 seconds
const MAX_POLL_INTERVAL = 30000; // 30 seconds
const MAX_RETRIES = 5;
const API_BASE_URL = 'http://127.0.0.1:3001';

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
      if (!validateTaskId(taskId)) {
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
    return /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(taskId);
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
      const responseData = await response.json();
      if (!responseData?.currentStatus) {
          throw new Error("Invalid response from task status API");
      }
      const taskStatus = responseData;
      const mappedStatus = mapApiStatus(taskStatus.currentStatus);
      
      if (mappedStatus === "completed") {
        if (!taskStatus.result) {
          throw new Error("Completed task missing image URLs");
        }
        
        const resultData = JSON.parse(taskStatus.result);
        const imageUrls = resultData.data.output?.image_urls || [];
        setResult({
          taskId,
          status: "completed",
          imageUrl: imageUrls[0],
          imageUrls,
          progress: 100
        });
        await storeGeneration(prompt, aspectRatio, imageUrls[0], user.uid);
        toast({
          title: "Success",
          description: "Image generated successfully!",
        });
        cleanupPolling();
        setIsGenerating(false);
      } else if (mappedStatus === "pending") {
        setResult({
          taskId,
          status: "pending",
          progress: taskStatus.progress || 0
        });
        scheduleNextPoll(taskId, prompt, aspectRatio, interval);
      } else {
        throw new Error(
          taskStatus.error || 
          `Task failed with status: ${taskStatus.currentStatus}`
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
