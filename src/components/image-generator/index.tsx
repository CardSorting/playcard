import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import useImageGeneration from "@/hooks/useImageGeneration";
import { useAuth } from "@/lib/contexts/auth-context";
import { GenerationControls } from "./GenerationControls";
import { ImagePreview } from "./ImagePreview";
import { GenerationHistory } from "./GenerationHistory";
import { Skeleton } from "@/components/ui/skeleton";

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [showHistory, setShowHistory] = useState(false);
  const { isGenerating, result, handleGenerate } = useImageGeneration();
  const { user } = useAuth();
  const [previousGenerations, setPreviousGenerations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial data loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

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
          <Card className="p-6 bg-white/10 backdrop-blur-sm border-gray-800">
            <GenerationControls
              prompt={prompt}
              aspectRatio={aspectRatio}
              isGenerating={isGenerating}
              showHistory={showHistory}
              onPromptChange={setPrompt}
              onAspectRatioChange={setAspectRatio}
              onGenerate={() => handleGenerate(prompt, aspectRatio)}
              onToggleHistory={() => setShowHistory(!showHistory)}
            />
          </Card>

          <Card className="p-6 bg-white/10 backdrop-blur-sm border-gray-800 relative">
            <h3 className="text-lg font-semibold text-white mb-4">
              {showHistory ? "Generation History" : "Generated Images"}
            </h3>
            {showHistory ? (
              <GenerationHistory
                generations={previousGenerations}
                onClose={() => setShowHistory(false)}
              />
            ) : (
              <ImagePreview
                imageUrls={result?.imageUrls}
                isGenerating={isGenerating}
                status={result?.status || "pending"}
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
