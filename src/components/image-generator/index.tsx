import { useState, useEffect } from "react";
import ExamplePrompts from "./ExamplePrompts";
import { Card } from "@/components/ui/card";
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
import { Loader2, ImageIcon, Download, History } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import { useAuth } from "@/lib/contexts/auth-context";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, orderBy, getDocs } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

interface GenerationResult {
  taskId: string;
  imageUrl?: string;
  status: "pending" | "completed" | "error";
}

interface StoredGeneration {
  id: string;
  userId: string;
  prompt: string;
  imageUrl: string;
  aspectRatio: string;
  createdAt: Date;
}

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [previousGenerations, setPreviousGenerations] = useState<StoredGeneration[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadPreviousGenerations();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const loadPreviousGenerations = async () => {
    if (!user) return;

    try {
      const generationsRef = collection(db, "cardGeneration");
      const q = query(
        generationsRef,
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const generations = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate()
      })) as StoredGeneration[];
      
      setPreviousGenerations(generations);
    } catch (error) {
      console.error("Error loading previous generations:", error);
      toast({
        title: "Error",
        description: "Failed to load previous generations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const storeGeneration = async (imageUrl: string) => {
    if (!user) return;

    try {
      const generationsRef = collection(db, "cardGeneration");
      await addDoc(generationsRef, {
        userId: user.uid,
        prompt,
        imageUrl,
        aspectRatio,
        createdAt: new Date()
      });

      await loadPreviousGenerations();
    } catch (error) {
      console.error("Error storing generation:", error);
      toast({
        title: "Error",
        description: "Failed to save generation history",
        variant: "destructive",
      });
    }
  };

  const handleGenerate = async () => {
    if (!prompt || !user) return;

    setIsGenerating(true);
    setResult({ taskId: "", status: "pending" });

    try {
      const response = await axios.post(
        "https://api.goapi.ai/api/v1/task",
        {
          model: "midjourney",
          task_type: "imagine",
          input: {
            prompt,
            aspect_ratio: aspectRatio,
            process_mode: "fast",
            skip_prompt_check: false,
            bot_id: 0,
          },
          config: {
            service_mode: "",
            webhook_config: {
              endpoint: "",
              secret: "",
            },
          },
        },
        {
          headers: {
            "x-api-key": import.meta.env.VITE_GOAPI_KEY || "",
            "Content-Type": "application/json",
          },
        }
      );

      const imageUrl = response.data.image_url;
      
      setResult({
        taskId: response.data.task_id,
        status: "completed",
        imageUrl,
      });

      await storeGeneration(imageUrl);

      toast({
        title: "Success",
        description: "Image generated successfully!",
      });
    } catch (error) {
      console.error("Error generating image:", error);
      setResult({ taskId: "", status: "error" });
      toast({
        title: "Error",
        description: "Failed to generate image",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-7xl mx-auto pt-20 px-4 sm:px-6 lg:px-8 pb-24">
          <div className="text-center mb-12">
            <Skeleton className="h-12 w-[400px] mx-auto mb-4" />
            <Skeleton className="h-4 w-[600px] mx-auto" />
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-8">
              <Card className="p-6 bg-white/10 backdrop-blur-sm border-gray-800">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <Skeleton className="h-[200px] w-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </div>
              </Card>
            </div>

            <Card className="p-6 bg-white/10 backdrop-blur-sm border-gray-800">
              <Skeleton className="h-[500px] w-full" />
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto pt-20 px-4 sm:px-6 lg:px-8 pb-24">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            AI Image Generator
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Create unique Pokemon card artwork using AI. Describe what you want
            to see, and watch your imagination come to life!
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-8">
            <Card className="p-6 bg-white/10 backdrop-blur-sm border-gray-800">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="prompt">Prompt</Label>
                  <Input
                    id="prompt"
                    placeholder="Describe the image you want to generate..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="bg-white/5 border-gray-700 text-white"
                  />
                </div>

                <ExamplePrompts onSelectExample={(prompt) => setPrompt(prompt)} />
                
                <div className="space-y-2">
                  <Label>Aspect Ratio</Label>
                  <Select value={aspectRatio} onValueChange={setAspectRatio}>
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
                    onClick={handleGenerate}
                    disabled={!prompt || isGenerating || !user}
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
                    onClick={() => setShowHistory(!showHistory)}
                  >
                    <History className="w-4 h-4" />
                  </Button>
                </div>

                {!user && (
                  <p className="text-sm text-yellow-400">
                    Please sign in to generate images
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* Preview Section */}
          <Card className="p-6 bg-white/10 backdrop-blur-sm border-gray-800 relative">
            <h3 className="text-lg font-semibold text-white mb-4">
              {showHistory ? "Generation History" : "Generated Image"}
            </h3>
            {showHistory ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  
                  <Button
                    variant="ghost"
                    className="text-gray-400 hover:text-white"
                    onClick={() => setShowHistory(false)}
                  >
                    Close
                  </Button>
                </div>
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {previousGenerations.map((gen) => (
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
                  {previousGenerations.length === 0 && (
                    <p className="text-gray-400 text-center py-4">
                      No previous generations found
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="aspect-square w-full rounded-lg overflow-hidden relative bg-white/5">
                {result?.imageUrl ? (
                  <>
                    <img
                      src={result.imageUrl}
                      alt="Generated artwork"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/75 backdrop-blur-sm text-white"
                      onClick={() => window.open(result.imageUrl, "_blank")}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {isGenerating ? (
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 mb-2 mx-auto animate-spin text-yellow-400" />
                        <p className="text-sm text-gray-400">
                          Creating your masterpiece...
                        </p>
                      </div>
                    ) : result?.status === "error" ? (
                      <div className="text-center text-red-400">
                        <p>Error generating image.</p>
                        <p className="text-sm">Please try again.</p>
                      </div>
                    ) : (
                      <div className="text-center text-gray-400">
                        <ImageIcon className="w-8 h-8 mb-2 mx-auto" />
                        <p>Your generated image will appear here</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
