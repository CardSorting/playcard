import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { CardData } from "../card-creator/types";
import CardPreview from "../card-creator/CardPreview";
import { PackageIcon, Plus, X, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/contexts/auth-context";
import { 
  createBoosterPack, 
  getUserPacks, 
  openBoosterPack,
  togglePackFavorite 
} from "@/lib/booster-packs";
import type { BoosterPack } from "@/lib/booster-pack-schema";

const CARDS_PER_PACK = 10;

export default function BoosterPacks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cards, setCards] = useState<CardData[]>([]);
  const [packs, setPacks] = useState<BoosterPack[]>([]);
  const [selectedCards, setSelectedCards] = useState<CardData[]>([]);
  const [packName, setPackName] = useState("");
  const [openedPack, setOpenedPack] = useState<BoosterPack | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load user's cards
        const storedCards = localStorage.getItem("pokemon-cards");
        if (storedCards) {
          setCards(JSON.parse(storedCards));
        }

        // Load user's packs from Firebase
        if (user) {
          const userPacks = await getUserPacks(user.uid);
          setPacks(userPacks);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error",
          description: "Failed to load your packs. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, toast]);

  const handleCreatePack = async () => {
    if (!user || !packName || selectedCards.length !== CARDS_PER_PACK) return;

    try {
      const newPack = await createBoosterPack(user.uid, {
        name: packName,
        cards: selectedCards,
        isPublic: true,
      });

      setPacks([newPack, ...packs]);
      setPackName("");
      setSelectedCards([]);

      toast({
        title: "Success",
        description: "Your booster pack has been created!",
      });
    } catch (error) {
      console.error("Error creating pack:", error);
      toast({
        title: "Error",
        description: "Failed to create pack. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleOpenPack = async (pack: BoosterPack) => {
    if (!user) return;

    try {
      const opening = await openBoosterPack(user.uid, pack.id);
      setOpenedPack(pack);

      // Add cards to user's collection
      const currentCards = JSON.parse(localStorage.getItem("pokemon-cards") || "[]");
      localStorage.setItem(
        "pokemon-cards",
        JSON.stringify([...currentCards, ...opening.cards])
      );

      toast({
        title: "Pack Opened!",
        description: `You got ${opening.cards.length} new cards!`,
      });
    } catch (error) {
      console.error("Error opening pack:", error);
      toast({
        title: "Error",
        description: "Failed to open pack. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleFavorite = async (pack: BoosterPack) => {
    if (!user) return;

    try {
      const isFavorited = await togglePackFavorite(user.uid, pack.id);
      setPacks(packs.map(p => 
        p.id === pack.id 
          ? { ...p, favoriteCount: p.favoriteCount + (isFavorited ? 1 : -1) }
          : p
      ));

      toast({
        title: isFavorited ? "Added to Favorites" : "Removed from Favorites",
        description: `${pack.name} has been ${isFavorited ? "added to" : "removed from"} your favorites.`,
      });
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({
        title: "Error",
        description: "Failed to update favorites. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleCardSelection = (card: CardData) => {
    if (selectedCards.includes(card)) {
      setSelectedCards(selectedCards.filter((c) => c !== card));
    } else if (selectedCards.length < CARDS_PER_PACK) {
      setSelectedCards([...selectedCards, card]);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-7xl mx-auto pt-20 px-4 sm:px-6 lg:px-8 pb-24">
          <div className="text-center mb-12">
            <Skeleton className="h-10 w-64 bg-gray-800 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 bg-gray-800 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-48 w-full bg-gray-800 rounded-xl"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (openedPack) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-7xl mx-auto pt-20 px-4 sm:px-6 lg:px-8 pb-24">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Opening {openedPack.name}
            </h1>
            <Button
              variant="outline"
              className="text-white border-gray-700 hover:bg-gray-800"
              onClick={() => setOpenedPack(null)}
            >
              Close Pack
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {openedPack.cards.map((card, index) => (
              <div
                key={index}
                className="transform hover:scale-105 transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <CardPreview data={card} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto pt-20 px-4 sm:px-6 lg:px-8 pb-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Booster Packs</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Create your own booster packs with exactly {CARDS_PER_PACK} cards!
          </p>
        </div>

        {/* Create Pack Section */}
        <Card className="p-6 bg-white/10 backdrop-blur-sm border-gray-800 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            Create New Pack
          </h2>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="packName">Pack Name</Label>
              <Input
                id="packName"
                value={packName}
                onChange={(e) => setPackName(e.target.value)}
                placeholder="Enter pack name"
                className="bg-white/5 border-gray-700 text-white"
              />
            </div>
            <div>
              <Label>
                Select Cards ({selectedCards.length}/{CARDS_PER_PACK} selected)
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-2">
                {cards.map((card, index) => (
                  <div
                    key={index}
                    className={`cursor-pointer transform transition-all duration-300 ${
                      selectedCards.includes(card)
                        ? "scale-95 opacity-50"
                        : selectedCards.length >= CARDS_PER_PACK
                          ? "opacity-25 cursor-not-allowed"
                          : "hover:scale-105"
                    }`}
                    onClick={() => toggleCardSelection(card)}
                  >
                    <CardPreview data={card} />
                  </div>
                ))}
              </div>
            </div>
            <Button
              onClick={handleCreatePack}
              disabled={!packName || selectedCards.length !== CARDS_PER_PACK}
              className="bg-yellow-400 hover:bg-yellow-500 text-black w-full"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Pack ({selectedCards.length}/{CARDS_PER_PACK})
            </Button>
          </div>
        </Card>

        {/* Packs List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packs.map((pack) => (
            <Card
              key={pack.id}
              className="p-6 bg-white/10 backdrop-blur-sm border-gray-800 relative group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-full bg-yellow-400/10">
                  <PackageIcon className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {pack.name}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {pack.totalCards} cards • {pack.openCount} opens
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleOpenPack(pack)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Open Pack
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="text-gray-400 hover:text-yellow-400 border-gray-700"
                  onClick={() => handleToggleFavorite(pack)}
                >
                  <PackageIcon className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
