import { Suspense } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Store, ShoppingBag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

function MarketplaceLoadingFallback() {
  return (
    <div className="space-y-6">
      <Card className="p-4 bg-white/10 backdrop-blur-sm border-gray-800">
        <Skeleton className="h-10 w-full bg-gray-800" />
      </Card>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton
            key={index}
            className="h-[400px] w-full bg-gray-800 rounded-xl"
          />
        ))}
      </div>
    </div>
  );
}

export default function MarketplaceLayout() {
  const location = useLocation();
  const isSellerDashboard = location.pathname.includes("/marketplace/seller");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto pt-20 px-4 sm:px-6 lg:px-8 pb-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Marketplace</h1>
          <p className="text-gray-400 max-w-2xl mx-auto mb-6">
            Buy, sell, and trade Pokemon cards and booster packs!
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button
              asChild
              variant={!isSellerDashboard ? "default" : "outline"}
              className={
                !isSellerDashboard
                  ? "bg-yellow-400 hover:bg-yellow-500 text-black"
                  : "text-white border-gray-700 hover:bg-gray-800"
              }
            >
              <Link to="/marketplace">
                <ShoppingBag className="w-5 h-5 mr-2" />
                Browse Market
              </Link>
            </Button>
            <Button
              asChild
              variant={isSellerDashboard ? "default" : "outline"}
              className={
                isSellerDashboard
                  ? "bg-yellow-400 hover:bg-yellow-500 text-black"
                  : "text-white border-gray-700 hover:bg-gray-800"
              }
            >
              <Link to="/marketplace/seller">
                <Store className="w-5 h-5 mr-2" />
                Seller Dashboard
              </Link>
            </Button>
          </div>
        </div>

        <Suspense fallback={<MarketplaceLoadingFallback />}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
}
