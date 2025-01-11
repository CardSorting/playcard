import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { CardData } from "../card-creator/types";
import { BoosterPack } from "../booster-packs/types";
import { MarketItem, useCart } from "./types";
import CardPreview from "../card-creator/CardPreview";
import {
  PackageIcon,
  ArrowLeft,
  ShoppingCart,
  Clock,
  User,
  Star,
  AlertCircle,
  CheckCircle2,
  Heart,
  Share2,
  Shield,
  Truck,
  Zap,
  MessageCircle,
  Info,
} from "lucide-react";

interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: number;
}

const sampleReviews: Review[] = [
  {
    id: "1",
    userId: "user1",
    userName: "PokemonMaster",
    rating: 5,
    comment:
      "Excellent condition and fast delivery! The card looks even better in person.",
    date: Date.now() - 86400000,
  },
  {
    id: "2",
    userId: "user2",
    userName: "CardCollector",
    rating: 4,
    comment: "Great addition to my collection. Seller was very responsive.",
    date: Date.now() - 172800000,
  },
  {
    id: "3",
    userId: "user3",
    userName: "TrainerElite",
    rating: 5,
    comment:
      "Perfect transaction! Would definitely buy from this seller again.",
    date: Date.now() - 259200000,
  },
];

export default function ProductListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [item, setItem] = useState<MarketItem | null>(null);
  const [purchaseStatus, setPurchaseStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [isLiked, setIsLiked] = useState(false);
  const [activeTab, setActiveTab] = useState<"description" | "reviews">(
    "description",
  );
  const { addItem } = useCart();

  useEffect(() => {
    const loadData = () => {
      const storedMarket = localStorage.getItem("pokemon-marketplace");
      if (storedMarket) {
        const items: MarketItem[] = JSON.parse(storedMarket);
        const foundItem = items.find((i) => i.id === id);
        if (foundItem) setItem(foundItem);
      }
    };

    loadData();
  }, [id]);

  const handlePurchase = () => {
    if (!item) return;

    try {
      // Remove from marketplace
      const marketItems: MarketItem[] = JSON.parse(
        localStorage.getItem("pokemon-marketplace") || "[]",
      );
      localStorage.setItem(
        "pokemon-marketplace",
        JSON.stringify(marketItems.filter((i) => i.id !== item.id)),
      );

      // Add to user's collection
      if (item.type === "card") {
        const cards = JSON.parse(localStorage.getItem("pokemon-cards") || "[]");
        localStorage.setItem(
          "pokemon-cards",
          JSON.stringify([...cards, item.item]),
        );
      } else {
        const packs = JSON.parse(
          localStorage.getItem("pokemon-booster-packs") || "[]",
        );
        localStorage.setItem(
          "pokemon-booster-packs",
          JSON.stringify([...packs, item.item]),
        );
      }

      setPurchaseStatus("success");
      setTimeout(() => {
        navigate("/marketplace");
      }, 2000);
    } catch (error) {
      setPurchaseStatus("error");
    }
  };

  if (!item) {
    return (
      <Card className="p-8 bg-white/10 backdrop-blur-sm border-gray-800 text-center">
        <div className="max-w-md mx-auto">
          <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-4">
            Item Not Found
          </h2>
          <p className="text-gray-400 mb-6">
            This item may have been removed or already sold.
          </p>
          <Button
            variant="outline"
            className="text-white border-gray-700 hover:bg-gray-800"
            onClick={() => navigate("/marketplace")}
          >
            Back to Marketplace
          </Button>
        </div>
      </Card>
    );
  }

  const averageRating =
    sampleReviews.reduce((acc, r) => acc + r.rating, 0) / sampleReviews.length;

  const PurchaseButtons = () => (
    <div className="flex gap-2">
      <Button
        size="lg"
        onClick={handlePurchase}
        disabled={purchaseStatus !== "idle"}
        className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black h-14 text-lg"
      >
        {purchaseStatus === "idle" && (
          <>
            <ShoppingCart className="w-5 h-5 mr-2" />
            Buy Now
          </>
        )}
        {purchaseStatus === "success" && (
          <>
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Purchased!
          </>
        )}
        {purchaseStatus === "error" && (
          <>
            <AlertCircle className="w-5 h-5 mr-2" />
            Error
          </>
        )}
      </Button>
      <Button
        size="lg"
        onClick={() => {
          addItem(item);
          toast({
            title: "Added to Cart",
            description: `${item.type === "card" ? (item.item as CardData).name : (item.item as BoosterPack).name} has been added to your cart.`,
          });
        }}
        variant="outline"
        className="flex-1 text-white border-gray-700 hover:bg-gray-800 h-14 text-lg"
      >
        Add to Cart
      </Button>
    </div>
  );

  return (
    <div className="space-y-6 pb-24 lg:pb-0">
      {/* Navigation Bar */}
      <div className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-lg border-b border-gray-800 -mx-4 px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/5"
            onClick={() => navigate("/marketplace")}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="hidden sm:inline">Back to Marketplace</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className={`${isLiked ? "text-red-400 border-red-400" : "text-gray-400 border-gray-700"} hover:text-red-400 hover:border-red-400`}
              onClick={() => setIsLiked(!isLiked)}
            >
              <Heart
                className="w-4 h-4"
                fill={isLiked ? "currentColor" : "none"}
              />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="text-gray-400 border-gray-700 hover:text-white hover:border-white"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="text-yellow-400 border-yellow-400"
          >
            {item.type === "card" ? "Trading Card" : "Booster Pack"}
          </Badge>
          {item.type === "card" && (
            <Badge variant="outline" className="border-gray-700">
              {(item.item as CardData).type} Type
            </Badge>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          {item.type === "card"
            ? (item.item as CardData).name
            : (item.item as BoosterPack).name}
        </h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-gray-400">
          <div className="flex items-center gap-1.5">
            <User className="w-4 h-4" />
            <span>{item.sellerName}</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>Listed {new Date(item.createdAt).toLocaleDateString()}</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <MessageCircle className="w-4 h-4" />
            <span>{sampleReviews.length} Reviews</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Left Column - Preview & Details */}
        <div className="space-y-6">
          {/* Product Preview */}
          <Card className="p-4 sm:p-6 bg-white/10 backdrop-blur-sm border-gray-800">
            <div className="flex justify-center">
              {item.type === "card" ? (
                <div className="transform hover:scale-105 transition-all duration-300">
                  <CardPreview data={item.item as CardData} />
                </div>
              ) : (
                <div className="aspect-square w-full max-w-md flex items-center justify-center bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 rounded-xl">
                  <PackageIcon className="w-20 sm:w-32 h-20 sm:h-32 text-yellow-400" />
                </div>
              )}
            </div>
          </Card>

          {/* Quick Stats - Mobile */}
          <div className="lg:hidden grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-white mb-1">
                {averageRating.toFixed(1)}
              </div>
              <p className="text-xs text-gray-400">Rating</p>
            </div>
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-white mb-1">
                {sampleReviews.length}
              </div>
              <p className="text-xs text-gray-400">Reviews</p>
            </div>
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-white mb-1">24h</div>
              <p className="text-xs text-gray-400">Delivery</p>
            </div>
          </div>

          {/* Product Details */}
          <Card className="p-4 sm:p-6 bg-white/10 backdrop-blur-sm border-gray-800">
            <div className="space-y-6">
              <div className="flex items-center gap-4 border-b border-gray-800 pb-4 overflow-x-auto">
                <button
                  className={`pb-4 -mb-4 whitespace-nowrap ${activeTab === "description" ? "text-yellow-400 border-b-2 border-yellow-400" : "text-gray-400"}`}
                  onClick={() => setActiveTab("description")}
                >
                  Description
                </button>
                <button
                  className={`pb-4 -mb-4 flex items-center gap-2 whitespace-nowrap ${activeTab === "reviews" ? "text-yellow-400 border-b-2 border-yellow-400" : "text-gray-400"}`}
                  onClick={() => setActiveTab("reviews")}
                >
                  <span>Reviews</span>
                  <Badge variant="outline" className="text-xs">
                    {sampleReviews.length}
                  </Badge>
                </button>
              </div>

              <ScrollArea className="h-[300px] sm:h-[400px] pr-4">
                {activeTab === "description" ? (
                  <div className="space-y-6">
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-300 leading-relaxed">
                        {item.type === "card" ? (
                          <>
                            A rare {(item.item as CardData).type} type Pokemon
                            card featuring {(item.item as CardData).name}. This
                            card is in mint condition and would make a great
                            addition to any collection.
                          </>
                        ) : (
                          <>
                            An exciting booster pack containing 10 random
                            Pokemon cards. Each pack is guaranteed to contain at
                            least one rare card.
                          </>
                        )}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white">
                        Highlights
                      </h3>
                      <div className="grid gap-4">
                        <div className="flex items-center gap-3 text-gray-300">
                          <div className="p-2 rounded-full bg-white/5">
                            <Zap className="w-5 h-5 text-yellow-400" />
                          </div>
                          <div>
                            <p className="font-medium">
                              Instant Digital Delivery
                            </p>
                            <p className="text-sm text-gray-400">
                              Get it immediately after purchase
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-gray-300">
                          <div className="p-2 rounded-full bg-white/5">
                            <Shield className="w-5 h-5 text-green-400" />
                          </div>
                          <div>
                            <p className="font-medium">Secure Transaction</p>
                            <p className="text-sm text-gray-400">
                              Your purchase is protected
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-gray-300">
                          <div className="p-2 rounded-full bg-white/5">
                            <Truck className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <p className="font-medium">Digital Item</p>
                            <p className="text-sm text-gray-400">
                              No shipping required
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {item.type === "card" && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">
                          Card Details
                        </h3>
                        <div className="grid gap-4">
                          <div className="flex items-center gap-3 text-gray-300">
                            <div className="p-2 rounded-full bg-white/5">
                              <Info className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                              <p className="font-medium">Card Type</p>
                              <p className="text-sm text-gray-400">
                                {(item.item as CardData).type} Type Pokemon
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                      <div className="text-4xl font-bold text-yellow-400">
                        {averageRating.toFixed(1)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-yellow-400">
                          {Array(5)
                            .fill(0)
                            .map((_, i) => (
                              <Star
                                key={i}
                                className="w-4 h-4"
                                fill={
                                  i < Math.round(averageRating)
                                    ? "currentColor"
                                    : "none"
                                }
                              />
                            ))}
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          Based on {sampleReviews.length} reviews
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {sampleReviews.map((review) => (
                        <div
                          key={review.id}
                          className="border-b border-gray-800 pb-6 last:border-0"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                                <User className="w-4 h-4 text-gray-400" />
                              </div>
                              <span className="font-medium text-white">
                                {review.userName}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-yellow-400">
                              {Array(5)
                                .fill(0)
                                .map((_, i) => (
                                  <Star
                                    key={i}
                                    className="w-4 h-4"
                                    fill={
                                      i < review.rating
                                        ? "currentColor"
                                        : "none"
                                    }
                                  />
                                ))}
                            </div>
                          </div>
                          <p className="text-gray-300">{review.comment}</p>
                          <p className="text-sm text-gray-500 mt-2">
                            Posted {new Date(review.date).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </ScrollArea>
            </div>
          </Card>
        </div>

        {/* Right Column - Purchase Info */}
        <div className="hidden lg:block lg:sticky lg:top-[88px] space-y-6 h-fit">
          {/* Desktop Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-yellow-400 border-yellow-400"
              >
                {item.type === "card" ? "Trading Card" : "Booster Pack"}
              </Badge>
              {item.type === "card" && (
                <Badge variant="outline" className="border-gray-700">
                  {(item.item as CardData).type} Type
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold text-white">
              {item.type === "card"
                ? (item.item as CardData).name
                : (item.item as BoosterPack).name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-gray-400">
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                <span>{item.sellerName}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>
                  Listed {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4" />
                <span>{sampleReviews.length} Reviews</span>
              </div>
            </div>
          </div>

          {/* Purchase Card */}
          <Card className="p-6 bg-white/10 backdrop-blur-sm border-gray-800">
            <div className="space-y-6">
              <div className="flex items-center justify-between py-4 border-y border-gray-800">
                <div className="space-y-1">
                  <p className="text-sm text-gray-400">Price</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-bold text-yellow-400">
                      ${item.price.toFixed(2)}
                    </p>
                    <span className="text-sm text-gray-500">USD</span>
                  </div>
                </div>
              </div>

              <PurchaseButtons />

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-2xl font-bold text-white mb-1">
                    {averageRating.toFixed(1)}
                  </div>
                  <p className="text-xs text-gray-400">Rating</p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-2xl font-bold text-white mb-1">
                    {sampleReviews.length}
                  </div>
                  <p className="text-xs text-gray-400">Reviews</p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-2xl font-bold text-white mb-1">24h</div>
                  <p className="text-xs text-gray-400">Delivery</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Mobile Purchase Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-gray-900/95 backdrop-blur-lg border-t border-gray-800">
        <Sheet>
          <SheetTrigger asChild>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-2xl font-bold text-yellow-400 truncate">
                  ${item.price.toFixed(2)}
                </p>
                <p className="text-sm text-gray-400">
                  {sampleReviews.length} Reviews
                </p>
              </div>
              <Button
                size="lg"
                className="bg-yellow-400 hover:bg-yellow-500 text-black px-8"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Purchase Options
              </Button>
            </div>
          </SheetTrigger>

          <SheetContent
            side="bottom"
            className="bg-gray-900 border-gray-800 p-6"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    Purchase Options
                  </h3>
                  <p className="text-sm text-gray-400">
                    Choose how you'd like to proceed
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-yellow-400">
                    ${item.price.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-400">USD</p>
                </div>
              </div>

              <PurchaseButtons />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
