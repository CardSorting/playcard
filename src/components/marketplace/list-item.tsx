import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CardData } from "../card-creator/types";
import { BoosterPack } from "../booster-packs/types";
import { MarketItem } from "./types";
import CardPreview from "../card-creator/CardPreview";
import {
  PackageIcon,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";

export default function ListItem() {
  const navigate = useNavigate();
  const [items, setItems] = useState<MarketItem[]>([]);
  const [userCards, setUserCards] = useState<CardData[]>([]);
  const [userPacks, setUserPacks] = useState<BoosterPack[]>([]);
  const [selectedItemType, setSelectedItemType] = useState<
    "card" | "pack" | ""
  >("");
  const [selectedItem, setSelectedItem] = useState<
    CardData | BoosterPack | null
  >(null);
  const [sellingPrice, setSellingPrice] = useState("");
  const [listingStep, setListingStep] = useState<1 | 2 | 3>(1);
  const [listingStatus, setListingStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  useEffect(() => {
    const loadData = () => {
      const storedCards = localStorage.getItem("pokemon-cards");
      const storedPacks = localStorage.getItem("pokemon-booster-packs");
      const storedMarket = localStorage.getItem("pokemon-marketplace");

      if (storedCards) setUserCards(JSON.parse(storedCards));
      if (storedPacks) setUserPacks(JSON.parse(storedPacks));
      if (storedMarket) setItems(JSON.parse(storedMarket));
    };

    loadData();
  }, []);

  const saveMarketItems = (newItems: MarketItem[]) => {
    setItems(newItems);
    localStorage.setItem("pokemon-marketplace", JSON.stringify(newItems));
  };

  const handleListItem = () => {
    if (!selectedItem || !sellingPrice) return;

    try {
      const newItem: MarketItem = {
        id: crypto.randomUUID(),
        type: selectedItemType as "card" | "pack",
        item: selectedItem,
        price: parseFloat(sellingPrice),
        sellerId: "user-1",
        sellerName: "You",
        createdAt: Date.now(),
      };

      saveMarketItems([...items, newItem]);
      setListingStatus("success");

      // Navigate back to dashboard after successful listing
      setTimeout(() => {
        navigate("/marketplace/seller");
      }, 2000);
    } catch (error) {
      setListingStatus("error");
    }
  };

  const renderListingStep = () => {
    switch (listingStep) {
      case 1:
        return (
          <div className="space-y-4">
            <Label>Select Item Type</Label>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className={`h-24 ${selectedItemType === "card" ? "border-yellow-400 bg-white/10" : "border-gray-700"}`}
                onClick={() => {
                  setSelectedItemType("card");
                  setListingStep(2);
                }}
              >
                <div className="flex flex-col items-center gap-2">
                  <img
                    src="https://api.dicebear.com/7.x/bottts/svg?seed=card"
                    alt="Card"
                    className="w-8 h-8"
                  />
                  <span>Pokemon Card</span>
                </div>
              </Button>
              <Button
                variant="outline"
                className={`h-24 ${selectedItemType === "pack" ? "border-yellow-400 bg-white/10" : "border-gray-700"}`}
                onClick={() => {
                  setSelectedItemType("pack");
                  setListingStep(2);
                }}
              >
                <div className="flex flex-col items-center gap-2">
                  <PackageIcon className="w-8 h-8" />
                  <span>Booster Pack</span>
                </div>
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Select Item</Label>
              <Button
                variant="ghost"
                className="text-sm text-gray-400 h-auto p-0"
                onClick={() => setListingStep(1)}
              >
                Change Type
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {(selectedItemType === "pack" ? userPacks : userCards).map(
                (item) => (
                  <Button
                    key={`${item.id}-${item.type}`}
                    variant="outline"
                    className={`p-2 h-auto aspect-square ${selectedItem?.id === item.id ? "border-yellow-400 bg-white/10" : "border-gray-700"}`}
                    onClick={() => {
                      setSelectedItem(item);
                      setListingStep(3);
                    }}
                  >
                    <div className="w-full aspect-square relative">
                      {selectedItemType === "card" ? (
                        <CardPreview data={item as CardData} />
                      ) : (
                        <div className="h-full flex items-center justify-center bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 rounded-lg">
                          <PackageIcon className="w-8 h-8 text-yellow-400" />
                        </div>
                      )}
                    </div>
                  </Button>
                ),
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Label>Set Price</Label>
              <Button
                variant="ghost"
                className="text-sm text-gray-400 h-auto p-0"
                onClick={() => setListingStep(2)}
              >
                Change Item
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="pl-9 bg-white/5 border-gray-700 text-white text-lg"
                    placeholder="0.00"
                  />
                </div>

                <Button
                  onClick={handleListItem}
                  disabled={
                    !selectedItem ||
                    !sellingPrice ||
                    listingStatus === "success"
                  }
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-black h-12 text-lg relative"
                >
                  {listingStatus === "idle" && "List for Sale"}
                  {listingStatus === "success" && (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" /> Listed Successfully
                    </span>
                  )}
                  {listingStatus === "error" && (
                    <span className="flex items-center gap-2 text-red-500">
                      <AlertCircle className="w-5 h-5" /> Error Listing Item
                    </span>
                  )}
                </Button>
              </div>

              <div className="hidden md:block">
                <div className="aspect-square relative max-w-[300px] mx-auto">
                  {selectedItemType === "card" ? (
                    <CardPreview data={selectedItem as CardData} />
                  ) : (
                    <div className="h-full flex items-center justify-center bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 rounded-lg">
                      <PackageIcon className="w-20 h-20 text-yellow-400" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          className="text-white hover:bg-white/5"
          onClick={() => navigate("/marketplace/seller")}
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      <Card className="p-6 bg-white/10 backdrop-blur-sm border-gray-800">
        <h2 className="text-xl font-semibold text-white mb-6">List New Item</h2>
        {renderListingStep()}
      </Card>
    </div>
  );
}
