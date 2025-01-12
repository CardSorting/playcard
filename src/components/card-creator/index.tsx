import { useState, useEffect } from "react";
import { CardData } from "./types";
import { useAuth } from "@/lib/contexts/auth-context";
import { createCard } from "@/lib/card-creator";
import { useToast } from "@/components/ui/use-toast";
import CardForm from "./CardForm";
import CardPreview from "./CardPreview";
import ImageUploader from "./ImageUploader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronUp } from "lucide-react";

export default function CardCreator() {
  const [cardData, setCardData] = useState<Partial<CardData>>({
    name: "",
    image: "",
    type: "Normal",
  });

  const { user } = useAuth();
  const { toast } = useToast();

  // Save card to Firebase when it's complete
  useEffect(() => {
    const saveCard = async () => {
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to save your card.",
          variant: "destructive",
        });
        return;
      }

      if (cardData.name && cardData.image && cardData.type) {
        try {
          await createCard(user.uid, user.displayName || "Anonymous", {
            name: cardData.name,
            type: cardData.type,
            imageUrl: cardData.image,
            isPublic: false, // Default to private
          });

          toast({
            title: "Card Saved",
            description: "Your card has been saved successfully.",
          });
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to save your card. Please try again.",
            variant: "destructive",
          });
          console.error("Error saving card:", error);
        }
      }
    };

    saveCard();
  }, [cardData, user, toast]);

  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto pt-20 px-4 sm:px-6 lg:px-8 pb-24">
        {/* Header */}
        <div className="text-center mb-8 lg:mb-12">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3 lg:mb-4">
            Create Your Pokemon Card
          </h1>
          <p className="text-sm lg:text-base text-gray-400 max-w-2xl mx-auto">
            Customize your card by selecting a type, adding a name, and
            uploading an image. Watch your creation come to life in real-time!
          </p>
        </div>

        {/* Mobile Preview Toggle */}
        <div className="lg:hidden sticky top-16 z-20 -mx-4 px-4 py-2 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 mb-6">
          <Button
            variant="ghost"
            className="w-full text-white hover:bg-white/5"
            onClick={() => setShowPreview(!showPreview)}
          >
            <span>{showPreview ? "Hide" : "Show"} Preview</span>
            <ChevronUp
              className={`w-4 h-4 ml-2 transition-transform ${showPreview ? "rotate-180" : ""}`}
            />
          </Button>
        </div>

        {/* Mobile Preview */}
        <div className={`lg:hidden ${showPreview ? "block" : "hidden"} mb-6`}>
          <Card className="p-4 bg-white/10 backdrop-blur-sm border-gray-800">
            <div className="flex justify-center">
              <div className="transform scale-[0.7] origin-top">
                <CardPreview data={cardData} />
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
          {/* Left Column - Form */}
          <div className="space-y-6">
            <Card className="p-4 lg:p-6 bg-white/10 backdrop-blur-sm border-gray-800">
              <h2 className="text-lg lg:text-xl font-semibold text-white mb-4">
                Card Details
              </h2>
              <CardForm data={cardData} onChange={setCardData} />
            </Card>

            <Card className="p-4 lg:p-6 bg-white/10 backdrop-blur-sm border-gray-800">
              <h2 className="text-lg lg:text-xl font-semibold text-white mb-4">
                Card Image
              </h2>
              <ImageUploader
                onImageSelect={(url) =>
                  setCardData((prev) => ({ ...prev, image: url }))
                }
              />
            </Card>
          </div>

          {/* Desktop Preview */}
          <div className="hidden lg:block lg:sticky lg:top-24">
            <Card className="p-6 bg-white/10 backdrop-blur-sm border-gray-800">
              <h2 className="text-xl font-semibold text-white mb-4">Preview</h2>
              <div className="flex justify-center">
                <div className="transform hover:scale-105 transition-transform duration-300">
                  <CardPreview data={cardData} />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Fixed Preview Button */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-gray-900/80 backdrop-blur-sm border-t border-gray-800">
        <Button
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-black"
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? "Hide" : "Show"} Preview
          <ChevronUp
            className={`w-4 h-4 ml-2 transition-transform ${showPreview ? "rotate-180" : ""}`}
          />
        </Button>
      </div>
    </div>
  );
}
