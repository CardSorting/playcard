import { useCart } from "../types";
import { CardData } from "../../card-creator/types";
import { BoosterPack } from "../../booster-packs/types";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import CardPreview from "../../card-creator/CardPreview";
import { PackageIcon } from "lucide-react";

export default function CheckoutSummary() {
  const { items, total } = useCart();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Order Summary</h2>
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 p-4 bg-white/5 rounded-lg relative"
            >
              <div className="w-20 h-20 shrink-0 overflow-hidden rounded-lg ring-1 ring-white/10">
                {item.type === "card" ? (
                  <CardPreview data={item.item as CardData} />
                ) : (
                  <div className="h-full flex items-center justify-center bg-gradient-to-br from-yellow-400/20 to-yellow-600/20">
                    <PackageIcon className="w-8 h-8 text-yellow-400" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
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
                        {item.type === "card" ? "Trading Card" : "Booster Pack"}
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
                  <div className="text-right">
                    <p className="text-lg font-bold text-yellow-400">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-400">
                      {item.quantity} × ${item.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator className="bg-gray-800" />

      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Subtotal</span>
          <span className="text-white">${total.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Processing Fee</span>
          <span className="text-white">$0.00</span>
        </div>
        <Separator className="bg-gray-800" />
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Total</span>
          <span className="text-2xl font-bold text-white">
            ${total.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
