import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardData } from "../card-creator/types";
import { addCardToCollection, getUserCards } from "@/lib/collection";
import CardPreview from "../card-creator/CardPreview";
import { PackageIcon, Plus, X, Sparkles } from "lucide-react";
import { getClaimPool } from "@/lib/claims";
import type { ClaimPool } from "@/lib/claim-schema";
import { useAuth } from "@/lib/contexts/auth-context";
import { 
  createBoosterPack, 
  getUserPacks, 
  openBoosterPack,
  togglePackFavorite,
  getPublicPacks
} from "@/lib/booster-packs";
import type { BoosterPack } from "@/lib/booster-pack-schema";

const CARDS_PER_PACK = 10;

export default function BoosterPacks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cards, setCards] = useState<CardData[]>([]);
  interface PackWithClaims extends BoosterPack {
    claimPool?: ClaimPool;
  }
  
  const [packs, setPacks] = useState<PackWithClaims[]>([]);
  const [selectedCards, setSelectedCards] = useState<CardData[]>([]);
  const [packName, setPackName] = useState("");
  const [openedPack, setOpenedPack] = useState<BoosterPack | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!user) {
          setIsLoading(false);
          return;
        }

        // Load user's cards from collection
        const userCards = await getUserCards(user.uid);
        setCards(userCards);

        // Load all public packs and their claim pools
        const publicPacks = await getPublicPacks();
        const packsWithClaims = await Promise.all(
          publicPacks.map(async (pack) => {
            if (pack.claimPoolId) {
              const claimPool = await getClaimPool(pack.claimPoolId);
              return { ...pack, claimPool: claimPool || undefined };
            }
            return pack;
          })
        );
        setPacks(packsWithClaims);
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error",
          description: "Failed to load packs. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, toast]);

  const loadUserPacks = async () => {
    if (!user) return;
    try {
      const userPacks = await getUserPacks(user.uid);
      const packsWithClaims = await Promise.all(
        userPacks.map(async (pack) => {
          if (pack.claimPoolId) {
            const claimPool = await getClaimPool(pack.claimPoolId);
            return { ...pack, claimPool: claimPool || undefined };
          }
          return pack;
        })
      );
      setPacks(packsWithClaims);
    } catch (error) {
      console.error("Error loading user packs:", error);
      toast({
        title: "Error",
        description: "Failed to load your packs. Please try again.",
        variant: "destructive",
      });
    }
  };

  const loadPublicPacks = async () => {
    try {
      const publicPacks = await getPublicPacks();
      const packsWithClaims = await Promise.all(
        publicPacks.map(async (pack) => {
          if (pack.claimPoolId) {
            const claimPool = await getClaimPool(pack.claimPoolId);
            return { ...pack, claimPool: claimPool || undefined };
          }
          return pack;
        })
      );
      setPacks(packsWithClaims);
    } catch (error) {
      console.error("Error loading public packs:", error);
      toast({
        title: "Error",
        description: "Failed to load community packs. Please try again.",
        variant: "destructive",
      });
    }
  };

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

  const handleOpenPack = async (pack: PackWithClaims) => {
    if (!user || !pack.claimPool) return;

    try {
      const userClaims = pack.claimPool.claims[user.uid]?.count || 0;
      if (userClaims >= pack.claimPool.perUserLimit) {
        toast({
          title: "Claim Limit Reached",
          description: "You have already claimed this pack the maximum number of times.",
          variant: "destructive",
        });
        return;
      }

      if (pack.claimPool.currentClaims >= pack.claimPool.totalLimit) {
        toast({
          title: "Pack Exhausted",
          description: "This pack has reached its total claim limit.",
          variant: "destructive",
        });
        return;
      }

      const opening = await openBoosterPack(user.uid, pack.id);
      setOpenedPack(pack);

      // Add cards to user's collection in Firebase
      for (const card of opening.cards) {
        await addCardToCollection(user.uid, card.id, {
          name: card.name,
          type: card.type,
          imageUrl: card.image,
          rarity: card.rarity,
        });
      }

      toast({
        title: "Pack Opened!",
        description: `You got ${opening.cards.length} new cards! (${pack.claimPool.perUserLimit - (userClaims + 1)} personal claims remaining)`,
      });
    } catch (error) {
      console.error("Error opening pack:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to open pack. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
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
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Booster Packs</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Share and collect free booster packs with the community!
          </p>
        </div>

        <Tabs defaultValue="community" className="mb-8">
          <TabsList className="grid w-full grid-cols-2 bg-white/5">
            <TabsTrigger
              value="community"
              onClick={loadPublicPacks}
              className="data-[state=active]:bg-white/10"
            >
              Community Packs
            </TabsTrigger>
            <TabsTrigger
              value="my-packs"
              onClick={loadUserPacks}
              className="data-[state=active]:bg-white/10"
            >
              My Packs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="community">
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
                        By {pack.creatorName || "Anonymous"} • {pack.openCount} opens
                        {pack.claimPool && (
                          <>
                            {" "}• {pack.claimPool.totalLimit - pack.claimPool.currentClaims} of {pack.claimPool.totalLimit} left
                            {user && ` • ${pack.claimPool.perUserLimit - (pack.claimPool.claims[user.uid]?.count || 0)} personal claims left`}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleOpenPack(pack)}
                    className="w-full bg-white/5 hover:bg-white/10 text-white"
                    disabled={
                      !user || 
                      !pack.claimPool ||
                      pack.claimPool.currentClaims >= pack.claimPool.totalLimit ||
                      (pack.claimPool.claims[user.uid]?.count || 0) >= pack.claimPool.perUserLimit
                    }
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    {!user 
                      ? "Sign in to Open"
                      : !pack.claimPool
                        ? "Not Available"
                        : pack.claimPool.currentClaims >= pack.claimPool.totalLimit
                          ? "All Claims Taken"
                          : (pack.claimPool.claims[user.uid]?.count || 0) >= pack.claimPool.perUserLimit
                            ? "Personal Limit Reached"
                            : "Open Pack"
                    }
                  </Button>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="my-packs">
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
                    {pack.claimPool && (
                      <>
                        {" "}• {pack.claimPool.totalLimit - pack.claimPool.currentClaims} of {pack.claimPool.totalLimit} total claims left •{" "}
                        {pack.claimPool.perUserLimit} max claims per user
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleOpenPack(pack)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white"
                  disabled={
                    !user || 
                    !pack.claimPool ||
                    pack.claimPool.currentClaims >= pack.claimPool.totalLimit ||
                    (pack.claimPool.claims[user.uid]?.count || 0) >= pack.claimPool.perUserLimit
                  }
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  {!user 
                    ? "Sign in to Open"
                    : !pack.claimPool
                      ? "Not Available"
                      : pack.claimPool.currentClaims >= pack.claimPool.totalLimit
                        ? "All Claims Taken"
                        : (pack.claimPool.claims[user.uid]?.count || 0) >= pack.claimPool.perUserLimit
                          ? "Personal Limit Reached"
                          : "Open Pack"
                  }
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
