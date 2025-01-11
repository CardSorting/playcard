import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardData } from "../card-creator/types";
import { BoosterPack } from "../booster-packs/types";
import { MarketItem } from "./types";
import CardPreview from "../card-creator/CardPreview";
import {
  PackageIcon,
  DollarSign,
  X,
  TrendingUp,
  Clock,
  Tag,
  Plus,
  LayoutGrid,
  ListIcon,
} from "lucide-react";

export default function SellerDashboard() {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "price-high" | "price-low"
  >("newest");

  useEffect(() => {
    const loadData = () => {
      const storedMarket = localStorage.getItem("pokemon-marketplace");
      if (storedMarket) setItems(JSON.parse(storedMarket));
    };

    loadData();
  }, []);

  const saveMarketItems = (newItems: MarketItem[]) => {
    setItems(newItems);
    localStorage.setItem("pokemon-marketplace", JSON.stringify(newItems));
  };

  const removeFromMarket = (itemId: string) => {
    saveMarketItems(items.filter((item) => item.id !== itemId));
  };

  const userListings = items.filter((item) => item.sellerId === "user-1");
  const totalRevenue = userListings.reduce((sum, item) => sum + item.price, 0);
  const cardListings = userListings.filter((item) => item.type === "card");
  const packListings = userListings.filter((item) => item.type === "pack");

  const averagePrice = totalRevenue / userListings.length || 0;
  const recentSales = 12; // This would come from a real backend
  const viewsToday = 156; // This would come from a real backend

  const sortedListings = [...userListings].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return b.createdAt - a.createdAt;
      case "oldest":
        return a.createdAt - b.createdAt;
      case "price-high":
        return b.price - a.price;
      case "price-low":
        return a.price - b.price;
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-8">
      {/* Quick Actions */}
      <div className="flex items-center justify-between">
        <Button
          asChild
          size="lg"
          className="bg-yellow-400 hover:bg-yellow-500 text-black"
        >
          <Link to="/marketplace/seller/list">
            <Plus className="w-5 h-5 mr-2" />
            List New Item
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className={`${viewMode === "grid" ? "bg-white/10 border-yellow-400" : "border-gray-700"}`}
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className={`${viewMode === "list" ? "bg-white/10 border-yellow-400" : "border-gray-700"}`}
            onClick={() => setViewMode("list")}
          >
            <ListIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-white/10 backdrop-blur-sm border-gray-800">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-yellow-400/10">
              <DollarSign className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-white">
                ${totalRevenue.toFixed(2)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white/10 backdrop-blur-sm border-gray-800">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-400/10">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Average Price</p>
              <p className="text-2xl font-bold text-white">
                ${averagePrice.toFixed(2)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white/10 backdrop-blur-sm border-gray-800">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-400/10">
              <Tag className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Active Listings</p>
              <p className="text-2xl font-bold text-white">
                {userListings.length}
              </p>
              <p className="text-sm text-gray-500">
                {cardListings.length} Cards, {packListings.length} Packs
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white/10 backdrop-blur-sm border-gray-800">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-purple-400/10">
              <Clock className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Recent Activity</p>
              <p className="text-2xl font-bold text-white">{recentSales}</p>
              <p className="text-sm text-gray-500">{viewsToday} views today</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Active Listings */}
      <Card className="p-6 bg-white/10 backdrop-blur-sm border-gray-800">
        <Tabs defaultValue="all" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="bg-white/5">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-white/10"
              >
                All Listings ({userListings.length})
              </TabsTrigger>
              <TabsTrigger
                value="cards"
                className="data-[state=active]:bg-white/10"
              >
                Cards ({cardListings.length})
              </TabsTrigger>
              <TabsTrigger
                value="packs"
                className="data-[state=active]:bg-white/10"
              >
                Packs ({packListings.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="space-y-6">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sortedListings.map((item) => (
                  <Card
                    key={item.id}
                    className="group p-4 bg-white/10 backdrop-blur-sm border-gray-800 overflow-hidden transition-all duration-300 hover:border-yellow-400/50 hover:bg-white/[0.12]"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      onClick={() => removeFromMarket(item.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>

                    <div className="aspect-square mb-4 relative overflow-hidden rounded-lg">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                      {item.type === "card" ? (
                        <CardPreview data={item.item as CardData} />
                      ) : (
                        <div className="h-full flex items-center justify-center bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 relative overflow-hidden">
                          <PackageIcon className="w-20 h-20 text-yellow-400" />
                          <div className="absolute inset-0 bg-yellow-400/5 backdrop-blur-sm" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white truncate">
                          {item.type === "card"
                            ? (item.item as CardData).name
                            : (item.item as BoosterPack).name}
                        </h3>
                        <span className="text-yellow-400 font-bold">
                          ${item.price.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>{item.type === "card" ? "Card" : "Pack"}</span>
                        <span>
                          Listed {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {sortedListings.map((item) => (
                  <Card
                    key={item.id}
                    className="group p-4 bg-white/10 backdrop-blur-sm border-gray-800 overflow-hidden transition-all duration-300 hover:border-yellow-400/50 hover:bg-white/[0.12]"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 relative overflow-hidden rounded-lg shrink-0">
                        {item.type === "card" ? (
                          <CardPreview data={item.item as CardData} />
                        ) : (
                          <div className="h-full flex items-center justify-center bg-gradient-to-br from-yellow-400/20 to-yellow-600/20">
                            <PackageIcon className="w-8 h-8 text-yellow-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-white truncate">
                            {item.type === "card"
                              ? (item.item as CardData).name
                              : (item.item as BoosterPack).name}
                          </h3>
                          <span className="text-yellow-400 font-bold ml-4">
                            ${item.price.toFixed(2)}
                          </span>
                        </div>

                        <div className="flex items-center text-sm text-gray-400">
                          <span className="mr-4">
                            {item.type === "card" ? "Card" : "Pack"}
                          </span>
                          <span>
                            Listed{" "}
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-red-400"
                        onClick={() => removeFromMarket(item.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="cards">
            {/* Similar grid/list view for cards only */}
          </TabsContent>

          <TabsContent value="packs">
            {/* Similar grid/list view for packs only */}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
