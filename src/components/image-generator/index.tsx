import { useState } from "react";
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
import { Loader2, ImageIcon, Download } from "lucide-react";
import axios from "axios";

interface GenerationResult {
  taskId: string;
  imageUrl?: string;
  status: "pending" | "completed" | "error";
}

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);

  const handleGenerate = async () => {
    if (!prompt) return;

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
        },
      );

      setResult({
        taskId: response.data.task_id,
        status: "completed",
        imageUrl: response.data.image_url, // Adjust based on actual API response
      });
    } catch (error) {
      console.error("Error generating image:", error);
      setResult({ taskId: "", status: "error" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto pt-20 px-4 sm:px-6 lg:px-8 pb-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            AI Image Generator
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Create unique Pokemon card artwork using AI. Describe what you want
            to see, and watch your imagination come to life!
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Input Section */}
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

              <Button
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-black"
                onClick={handleGenerate}
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
            </div>
          </Card>

          {/* Preview Section */}
          <Card className="p-6 bg-white/10 backdrop-blur-sm border-gray-800">
            <div className="aspect-square w-full rounded-lg overflow-hidden relative">
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
                <div className="w-full h-full flex items-center justify-center bg-white/5">
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
          </Card>
        </div>
      </div>
    </div>
  );
}
