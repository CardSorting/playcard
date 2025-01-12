import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Crown, Star, PackageIcon, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/contexts/auth-context";
import { getClaimPool, claimFromPool } from "@/lib/claims";
import type { ClaimPool } from "@/lib/claim-schema";
import type { BoosterPack } from "@/lib/booster-pack-schema";
import { getPublicPacks } from "@/lib/booster-packs";
import { addCardToCollection } from "@/lib/collection";
import CardPreview from "../card-creator/CardPreview";

interface ClaimableItem extends BoosterPack {
  claimPool: ClaimPool;
}

export default function Claims() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<ClaimableItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<ClaimPool['tier']>('common');

  useEffect(() => {
    loadItems();
  }, [user]);

  const loadItems = async () => {
    try {
      setIsLoading(true);
      const packs = await getPublicPacks();
      const claimablePacks = (await Promise.all(
        packs.map(async (pack) => {
          if (!pack.claimPoolId) return null;
          const claimPool = await getClaimPool(pack.claimPoolId);
          if (!claimPool) return null;
          return { ...pack, claimPool };
        })
      )).filter((pack): pack is ClaimableItem => pack !== null);

      setItems(claimablePacks);
    } catch (error) {
      console.error("Error loading claimable items:", error);
      toast({
        title: "Error",
        description: "Failed to load claimable items. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaim = async (item: ClaimableItem) => {
    if (!user) return;

    try {
      // Claim from pool first
      await claimFromPool(item.claimPool.id, user.uid);

      // Add cards to collection
      for (const card of item.cards) {
        await addCardToCollection(user.uid, card.id, {
          name: card.name,
          type: card.type,
          imageUrl: card.image,
          rarity: card.rarity,
        });
      }

      toast({
        title: "Success!",
        description: `Claimed ${item.name} successfully!`,
      });

      // Refresh items
      loadItems();
    } catch (error) {
      console.error("Error claiming item:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to claim. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
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

  const filteredItems = items.filter(item => item.claimPool.tier === selectedTier);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto pt-20 px-4 sm:px-6 lg:px-8 pb-24">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Claim Center</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Claim free booster packs from the community!
          </p>
        </div>

        <Tabs defaultValue="common" className="mb-8" onValueChange={(value) => setSelectedTier(value as ClaimPool['tier'])}>
          <TabsList className="grid w-full grid-cols-3 bg-white/5">
            <TabsTrigger
              value="common"
              className="data-[state=active]:bg-white/10"
            >
              <PackageIcon className="w-4 h-4 mr-2" />
              Common
            </TabsTrigger>
            <TabsTrigger
              value="rare"
              className="data-[state=active]:bg-white/10"
            >
              <Star className="w-4 h-4 mr-2" />
              Rare
            </TabsTrigger>
            <TabsTrigger
              value="ultra_rare"
              className="data-[state=active]:bg-white/10"
            >
              <Crown className="w-4 h-4 mr-2" />
              Ultra Rare
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTier}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <Card
                  key={item.id}
                  className="p-6 bg-white/10 backdrop-blur-sm border-gray-800 relative group"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`p-3 rounded-full ${
                      item.claimPool.tier === 'ultra_rare' ? 'bg-purple-400/10' :
                      item.claimPool.tier === 'rare' ? 'bg-yellow-400/10' :
                      'bg-gray-400/10'
                    }`}>
                      {item.claimPool.tier === 'ultra_rare' ? (
                        <Crown className="w-6 h-6 text-purple-400" />
                      ) : item.claimPool.tier === 'rare' ? (
                        <Star className="w-6 h-6 text-yellow-400" />
                      ) : (
                        <PackageIcon className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-400">
                        By {item.creatorName || "Anonymous"} • {item.openCount} opens
                      </p>
                      <p className="text-sm text-gray-400">
                        {item.claimPool.totalLimit - item.claimPool.currentClaims} of {item.claimPool.totalLimit} left
                        {user && ` • ${item.claimPool.perUserLimit - (item.claimPool.claims[user.uid]?.count || 0)} personal claims left`}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-2 mb-4">
                    {item.cards.slice(0, 5).map((card, index) => (
                      <div
                        key={index}
                        className="transform hover:scale-105 transition-all duration-300"
                      >
                        <CardPreview data={card} />
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => handleClaim(item)}
                    className={`w-full ${
                      item.claimPool.tier === 'ultra_rare' ? 'bg-purple-500/10 hover:bg-purple-500/20' :
                      item.claimPool.tier === 'rare' ? 'bg-yellow-500/10 hover:bg-yellow-500/20' :
                      'bg-white/5 hover:bg-white/10'
                    } text-white`}
                    disabled={
                      !user ||
                      item.claimPool.currentClaims >= item.claimPool.totalLimit ||
                      (item.claimPool.claims[user.uid]?.count || 0) >= item.claimPool.perUserLimit
                    }
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    {!user 
                      ? "Sign in to Claim"
                      : item.claimPool.currentClaims >= item.claimPool.totalLimit
                        ? "All Claims Taken"
                        : (item.claimPool.claims[user.uid]?.count || 0) >= item.claimPool.perUserLimit
                          ? "Personal Limit Reached"
                          : "Claim Pack"
                    }
                  </Button>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
