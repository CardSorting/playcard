import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CardData } from "../card-creator/types";
import { BoosterPack } from "../booster-packs/types";
import { useCart } from "./types";
import CardPreview from "../card-creator/CardPreview";
import {
  PackageIcon,
  ShoppingCart,
  Minus,
  Plus,
  X,
  ArrowLeft,
  CreditCard,
  Loader2,
  Shield,
  Clock,
  Truck,
} from "lucide-react";

export default function Cart() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { items, removeItem, updateQuantity, clearCart, total, itemCount } =
    useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleCheckout = async () => {
    if (items.length === 0) return;

    setIsCheckingOut(true);
    try {
      // Simulate checkout process
      await new Promise((resolve) => setTimeout(resolve, 2000));
      navigate("/checkout");
      return;
      // Add items to collections
      items.forEach((item) => {
        if (item.type === "card") {
          const cards = JSON.parse(
            localStorage.getItem("pokemon-cards") || "[]",
          );
          for (let i = 0; i < item.quantity; i++) {
            cards.push(item.item);
          }
          localStorage.setItem("pokemon-cards", JSON.stringify(cards));
        } else {
          const packs = JSON.parse(
            localStorage.getItem("pokemon-booster-packs") || "[]",
          );
          for (let i = 0; i < item.quantity; i++) {
            packs.push(item.item);
          }
          localStorage.setItem("pokemon-booster-packs", JSON.stringify(packs));
        }

        // Remove from marketplace
        const marketItems = JSON.parse(
          localStorage.getItem("pokemon-marketplace") || "[]",
        );
        localStorage.setItem(
          "pokemon-marketplace",
          JSON.stringify(marketItems.filter((i) => i.id !== item.id)),
        );
      });

      clearCart();
      toast({
        title: "Purchase Successful",
        description: "Your items have been added to your collection.",
      });
      navigate("/collection");
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error processing your purchase.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-7xl mx-auto pt-20 px-4 sm:px-6 lg:px-8 pb-24">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/5"
              onClick={() => navigate("/marketplace")}
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Marketplace
            </Button>
          </div>

          <Card className="p-8 bg-white/10 backdrop-blur-sm border-gray-800 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-yellow-400/10 flex items-center justify-center">
                <ShoppingCart className="w-10 h-10 text-yellow-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Your cart is empty
              </h2>
              <p className="text-gray-400 mb-8">
                Browse the marketplace to find Pokemon cards and booster packs!
              </p>
              <Button
                onClick={() => navigate("/marketplace")}
                size="lg"
                className="bg-yellow-400 hover:bg-yellow-500 text-black px-8"
              >
                Browse Marketplace
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto pt-20 px-4 sm:px-6 lg:px-8 pb-24">
        <div className="flex items-center justify-between gap-4 mb-8">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/5"
            onClick={() => navigate("/marketplace")}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Marketplace
          </Button>
          <h1 className="text-2xl font-bold text-white hidden sm:block">
            Shopping Cart
          </h1>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-yellow-400 border-yellow-400"
            >
              {itemCount} {itemCount === 1 ? "Item" : "Items"}
            </Badge>
            <Badge variant="outline" className="border-gray-700">
              ${total.toFixed(2)}
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 bg-white/10 backdrop-blur-sm border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Your Items</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-white/5"
                  onClick={clearCart}
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Cart
                </Button>
              </div>

              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="group relative overflow-hidden rounded-lg border border-gray-800 bg-gradient-to-br from-white/[0.07] to-white/[0.05] backdrop-blur-sm transition-all duration-300 hover:border-yellow-400/50 hover:from-white/[0.09] hover:to-white/[0.07]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/0 via-yellow-400/5 to-yellow-400/0 opacity-0 group-hover:opacity-100 transition-opacity" />

                      <div className="relative flex gap-6 p-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400"
                          onClick={() => removeItem(item.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>

                        <div className="w-24 h-24 shrink-0 overflow-hidden rounded-lg ring-1 ring-white/10">
                          {item.type === "card" ? (
                            <CardPreview data={item.item as CardData} />
                          ) : (
                            <div className="h-full flex items-center justify-center bg-gradient-to-br from-yellow-400/20 to-yellow-600/20">
                              <PackageIcon className="w-8 h-8 text-yellow-400" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 py-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-lg font-semibold text-white truncate pr-8">
                                {item.type === "card"
                                  ? (item.item as CardData).name
                                  : (item.item as BoosterPack).name}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                  variant="outline"
                                  className="text-xs border-gray-700"
                                >
                                  {item.type === "card"
                                    ? "Trading Card"
                                    : "Booster Pack"}
                                </Badge>
                                {item.type === "card" && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs border-gray-700"
                                  >
                                    {(item.item as CardData).type} Type
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <p className="text-lg font-bold text-yellow-400">
                              ${(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 text-gray-400 border-gray-700 hover:border-yellow-400 hover:text-yellow-400"
                                onClick={() =>
                                  updateQuantity(
                                    item.id,
                                    Math.max(1, item.quantity - 1),
                                  )
                                }
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) =>
                                  updateQuantity(
                                    item.id,
                                    Math.max(1, parseInt(e.target.value) || 1),
                                  )
                                }
                                className="w-16 text-center bg-white/5 border-gray-700 text-white"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 text-gray-400 border-gray-700 hover:border-yellow-400 hover:text-yellow-400"
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity + 1)
                                }
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                            <p className="text-sm text-gray-400">
                              ${item.price.toFixed(2)} each
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card className="p-6 bg-white/10 backdrop-blur-sm border-gray-800">
              <h2 className="text-xl font-semibold text-white mb-6">
                Order Summary
              </h2>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Subtotal</span>
                    <span className="text-white">${total.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Processing Fee</span>
                    <span className="text-white">$0.00</span>
                  </div>
                  <Separator className="my-4 bg-gray-800" />
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Total</span>
                    <span className="text-2xl font-bold text-white">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-black h-14 text-lg relative overflow-hidden"
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                >
                  {isCheckingOut ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mr-2" />
                      Checkout
                    </>
                  )}
                </Button>

                <div className="grid grid-cols-3 gap-4 pt-6">
                  <div className="text-center">
                    <div className="w-10 h-10 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-2">
                      <Shield className="w-5 h-5 text-green-400" />
                    </div>
                    <p className="text-xs text-gray-400">Secure Payment</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-2">
                      <Clock className="w-5 h-5 text-blue-400" />
                    </div>
                    <p className="text-xs text-gray-400">Instant Delivery</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-2">
                      <Truck className="w-5 h-5 text-purple-400" />
                    </div>
                    <p className="text-xs text-gray-400">Digital Items</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
