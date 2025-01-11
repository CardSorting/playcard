import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Nav } from "@/components/ui/nav";

// Lazy load components
const Home = lazy(() => import("./components/home"));
const CardCreator = lazy(() => import("./components/card-creator"));
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

function LoadingFallback() {
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
