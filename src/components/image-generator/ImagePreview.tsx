import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Download, ImageIcon, LayoutGrid, Sparkles, Clock, MessageSquare } from "lucide-react";
import { Loader2 } from "lucide-react";

interface ImageUrls {
  main: string;
  variants: string[];
  temporary: string[];
  discord: string;
}

interface ImagePreviewProps {
  imageUrls?: ImageUrls;
  isGenerating: boolean;
  status: "pending" | "completed" | "error";
}

export function ImagePreview({ imageUrls, isGenerating, status }: ImagePreviewProps) {
  if (imageUrls) {
    return (
      <Tabs defaultValue="main" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="main">
            <LayoutGrid className="w-4 h-4 mr-2" />
            Main
          </TabsTrigger>
          <TabsTrigger value="variants">
            <Sparkles className="w-4 h-4 mr-2" />
            Variants
          </TabsTrigger>
          <TabsTrigger value="temporary">
            <Clock className="w-4 h-4 mr-2" />
            Temporary
          </TabsTrigger>
          <TabsTrigger value="discord">
            <MessageSquare className="w-4 h-4 mr-2" />
            Discord
          </TabsTrigger>
        </TabsList>

        <TabsContent value="main">
          <ImageCarousel urls={[imageUrls.main]} />
        </TabsContent>

        <TabsContent value="variants">
          <ImageCarousel urls={imageUrls.variants} />
        </TabsContent>

        <TabsContent value="temporary">
          <ImageCarousel urls={imageUrls.temporary} />
        </TabsContent>

        <TabsContent value="discord">
          <ImageCarousel urls={[imageUrls.discord]} />
        </TabsContent>
      </Tabs>
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

function ImageCarousel({ urls }: { urls: string[] }) {
  if (urls.length === 0) {
    return (
      <div className="text-center text-gray-400 py-4">
        <p>No images available</p>
      </div>
    );
  }

  return (
    <Carousel className="w-full">
      <CarouselContent>
        {urls.map((url, index) => (
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
      {urls.length > 1 && (
        <>
          <CarouselPrevious className="left-2" />
          <CarouselNext className="right-2" />
        </>
      )}
    </Carousel>
  );
}