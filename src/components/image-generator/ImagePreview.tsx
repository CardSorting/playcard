import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Loader2, ImageIcon } from "lucide-react";

interface ImagePreviewProps {
  imageUrls?: string[];
  isGenerating: boolean;
  status: "pending" | "completed" | "error";
}

export function ImagePreview({ imageUrls, isGenerating, status }: ImagePreviewProps) {
  if (imageUrls) {
    return (
      <Carousel className="w-full">
        <CarouselContent>
          {imageUrls.map((url, index) => (
            <CarouselItem key={index}>
              <div className="relative aspect-square">
                <img
                  src={url}
                  alt={`Generated artwork ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <Button
                  className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/75 backdrop-blur-sm text-white"
                  onClick={() => window.open(url, "_blank")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {imageUrls.length > 1 && (
          <>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </>
        )}
      </Carousel>
    );
  }

  if (isGenerating) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mb-2 mx-auto animate-spin text-yellow-400" />
          <p className="text-sm text-gray-400">
            Creating your masterpiece...
          </p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="text-center text-red-400">
        <p>Error generating image.</p>
        <p className="text-sm">Please try again.</p>
      </div>
    );
  }

  return (
    <div className="text-center text-gray-400">
      <ImageIcon className="w-8 h-8 mb-2 mx-auto" />
      <p>Your generated images will appear here</p>
    </div>
  );
}