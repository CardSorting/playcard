import { Suspense, lazy } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Nav } from "@/components/ui/nav";

// Lazy load components
const Home = lazy(() => import("./components/home"));
const CardCreator = lazy(() => import("./components/card-creator"));
const Cart = lazy(() => import("./components/marketplace/cart"));
const Collection = lazy(() => import("./components/collection"));
const BoosterPacks = lazy(() => import("./components/booster-packs"));
const MarketplaceLayout = lazy(() => import("./components/marketplace/layout"));
const Marketplace = lazy(() => import("./components/marketplace"));
const SellerDashboard = lazy(
  () => import("./components/marketplace/seller-dashboard"),
);
const ListItem = lazy(() => import("./components/marketplace/list-item"));
const ProductListing = lazy(
  () => import("./components/marketplace/product-listing"),
);
const ImageGenerator = lazy(() => import("./components/image-generator"));

function LoadingFallback() {
  const location = useLocation();

  // Enhanced loading state for image generator
  if (location.pathname === "/generate") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-7xl mx-auto pt-20 px-4 sm:px-6 lg:px-8 pb-24">
          <div className="text-center mb-12">
            <Skeleton className="h-12 w-72 bg-gray-800 mx-auto mb-4" />
            <Skeleton className="h-6 w-[500px] bg-gray-800 mx-auto" />
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Input Section Loading */}
            <Card className="p-6 bg-white/10 backdrop-blur-sm border-gray-800">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-16 bg-gray-800" />
                  <Skeleton className="h-10 w-full bg-gray-800" />
                </div>

                <div className="space-y-2">
                  <Skeleton className="h-5 w-24 bg-gray-800" />
                  <Skeleton className="h-10 w-full bg-gray-800" />
                </div>

                <Skeleton className="h-10 w-full bg-gray-800" />
              </div>
            </Card>

            {/* Preview Section Loading */}
            <Card className="p-6 bg-white/10 backdrop-blur-sm border-gray-800">
              <div className="aspect-square w-full rounded-lg overflow-hidden relative">
                <div className="w-full h-full bg-gray-800 animate-pulse flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full border-4 border-yellow-400/20 border-t-yellow-400 animate-spin mx-auto mb-4" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32 bg-gray-700 mx-auto" />
                      <Skeleton className="h-4 w-24 bg-gray-700 mx-auto" />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Default loading state for other routes
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto pt-20 px-4 sm:px-6 lg:px-8 pb-24">
        <div className="text-center mb-12">
          <Skeleton className="h-10 w-64 bg-gray-800 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 bg-gray-800 mx-auto" />
        </div>
        <Card className="p-4 bg-white/10 backdrop-blur-sm border-gray-800 mb-6">
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
    </div>
  );
}

function App() {
  return (
    <div className="min-h-screen">
      <Nav />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CardCreator />} />
          <Route path="/collection" element={<Collection />} />
          <Route path="/packs" element={<BoosterPacks />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/generate" element={<ImageGenerator />} />
          <Route path="/marketplace" element={<MarketplaceLayout />}>
            <Route index element={<Marketplace />} />
            <Route path="seller" element={<SellerDashboard />} />
            <Route path="seller/list" element={<ListItem />} />
            <Route path=":id" element={<ProductListing />} />
          </Route>
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
