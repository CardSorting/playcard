import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CardData } from "../card-creator/types";
import { BoosterPack } from "../booster-packs/types";
import { MarketItem, MarketFilters } from "./types";
import CardPreview from "../card-creator/CardPreview";
import { PackageIcon, DollarSign, Filter, Search, X } from "lucide-react";

const ITEMS_PER_PAGE = 12;

export default function Marketplace() {
  const navigate = useNavigate();
  const [items, setItems] = useState<MarketItem[]>([]);
  const [filters, setFilters] = useState<MarketFilters>({
    type: "all",
    minPrice: undefined,
    maxPrice: undefined,
    pokemonType: undefined,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const loadData = () => {
      const storedMarket = localStorage.getItem("pokemon-marketplace");
      if (storedMarket) setItems(JSON.parse(storedMarket));
      setIsLoading(false);
    };

    setTimeout(loadData, 100);
  }, []);

  const saveMarketItems = (newItems: MarketItem[]) => {
    setItems(newItems);
    localStorage.setItem("pokemon-marketplace", JSON.stringify(newItems));
  };

  const buyItem = (item: MarketItem) => {
    saveMarketItems(items.filter((i) => i.id !== item.id));

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
  };

  const filteredItems = items.filter((item) => {
    if (
      searchQuery &&
      !(
        item.type === "card"
          ? (item.item as CardData).name
          : (item.item as BoosterPack).name
      )
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    )
      return false;
    if (filters.type && filters.type !== "all" && item.type !== filters.type)
      return false;
    if (filters.minPrice && item.price < filters.minPrice) return false;
    if (filters.maxPrice && item.price > filters.maxPrice) return false;
    if (
      filters.pokemonType &&
      item.type === "card" &&
      (item.item as CardData).type !== filters.pokemonType
    )
      return false;
    return true;
  });

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const currentItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const pokemonTypes = [
    "Normal",
    "Fire",
    "Water",
    "Electric",
    "Grass",
    "Ice",
    "Fighting",
    "Poison",
    "Ground",
    "Flying",
    "Psychic",
    "Bug",
    "Rock",
    "Ghost",
    "Dragon",
    "Dark",
    "Steel",
    "Fairy",
  ];

  const clearFilters = () => {
    setFilters({
      type: "all",
      minPrice: undefined,
      maxPrice: undefined,
      pokemonType: undefined,
    });
    setSearchQuery("");
  };

  if (isLoading) {
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

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <Card className="p-4 bg-white/10 backdrop-blur-sm border-gray-800">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items..."
              className="pl-9 bg-white/5 border-gray-700 text-white"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className={`flex-1 sm:flex-none ${showFilters ? "bg-white/10 text-white" : "text-white border-gray-700 hover:bg-gray-800"}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            {(showFilters ||
              Object.values(filters).some(
                (v) => v !== undefined && v !== "all",
              ) ||
              searchQuery) && (
              <Button
                variant="outline"
                className="text-white border-gray-700 hover:bg-gray-800"
                onClick={clearFilters}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="grid gap-4 md:grid-cols-4 mt-4 pt-4 border-t border-gray-700">
            <div>
              <Label>Type</Label>
              <Select
                value={filters.type || "all"}
                onValueChange={(value) =>
                  setFilters({ ...filters, type: value as any })
                }
              >
                <SelectTrigger className="bg-white/5 border-gray-700 text-white">
                  <SelectValue placeholder="All Items" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="card">Cards Only</SelectItem>
                  <SelectItem value="pack">Packs Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Min Price</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={filters.minPrice || ""}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      minPrice: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  className="pl-9 bg-white/5 border-gray-700 text-white"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <Label>Max Price</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={filters.maxPrice || ""}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      maxPrice: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  className="pl-9 bg-white/5 border-gray-700 text-white"
                  placeholder="0.00"
                />
              </div>
            </div>

            {filters.type !== "pack" && (
              <div>
                <Label>Pokemon Type</Label>
                <Select
                  value={filters.pokemonType || "any"}
                  onValueChange={(value) =>
                    setFilters({
                      ...filters,
                      pokemonType: value === "any" ? undefined : value,
                    })
                  }
                >
                  <SelectTrigger className="bg-white/5 border-gray-700 text-white">
                    <SelectValue placeholder="Any type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any type</SelectItem>
                    {pokemonTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-400">
        <p>
          Showing {currentItems.length} of {filteredItems.length} items
        </p>
        {filteredItems.length === 0 && (
          <Button
            variant="link"
            className="text-yellow-400 p-0 h-auto"
            onClick={clearFilters}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Market Items */}
      {filteredItems.length === 0 ? (
        <Card className="p-8 bg-white/10 backdrop-blur-sm border-gray-800 text-center">
          <div className="max-w-md mx-auto">
            <h2 className="text-xl font-semibold text-white mb-2">
              No items found
            </h2>
            <p className="text-gray-400 mb-4">
              Try adjusting your filters or search query
            </p>
            <Button
              variant="outline"
              className="text-white border-gray-700 hover:bg-gray-800"
              onClick={clearFilters}
            >
              Clear all filters
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {currentItems.map((item) => (
            <Card
              key={item.id}
              className="group p-4 bg-white/10 backdrop-blur-sm border-gray-800 overflow-hidden transition-all duration-300 hover:border-yellow-400/50 hover:bg-white/[0.12]"
              onClick={() => navigate(`/marketplace/${item.id}`)}
              role="button"
              tabIndex={0}
            >
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
                  <span>by {item.sellerName}</span>
                </div>

                <Button
                  onClick={() => buyItem(item)}
                  className="w-full bg-white/5 hover:bg-white/10 text-white group-hover:bg-yellow-400 group-hover:text-black transition-colors"
                >
                  Buy Now
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              className={
                currentPage === page
                  ? "bg-yellow-400 hover:bg-yellow-500 text-black"
                  : "text-white border-gray-700 hover:bg-gray-800"
              }
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
