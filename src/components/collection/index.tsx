import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import CardPreview from "../card-creator/CardPreview";
import { PlusIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { CardData } from "../card-creator/types";
import { useAuth } from "@/lib/contexts/auth-context";
import { getCollectionCards } from "@/lib/collection";
import { useToast } from "@/components/ui/use-toast";

const CARDS_PER_PAGE = 8;

export default function Collection() {
  const [cards, setCards] = useState<CardData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCards, setTotalCards] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const loadCards = async () => {
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to view your collection.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      try {
        const result = await getCollectionCards(user.uid, {
          page: currentPage,
          limit: CARDS_PER_PAGE,
          sort: { field: "date", direction: "desc" },
        });

        setCards(
          result.cards.map((card) => ({
            id: card.id,
            name: card.snapshot.name,
            type: card.snapshot.type,
            image: card.snapshot.imageUrl,
            rarity: card.snapshot.rarity as CardData['rarity'],
          }))
        );
        setTotalCards(result.total);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading cards:", error);
        toast({
          title: "Error",
          description: "Failed to load your collection. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };

    loadCards();
  }, [user, currentPage, toast]);

  const totalPages = Math.ceil(totalCards / CARDS_PER_PAGE);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-7xl mx-auto pt-20 px-4 sm:px-6 lg:px-8 pb-24">
          <div className="text-center mb-12">
            <Skeleton className="h-10 w-64 bg-gray-800 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 bg-gray-800 mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-[560px] w-full bg-gray-800 rounded-xl"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto pt-20 px-4 sm:px-6 lg:px-8 pb-24">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Your Card Collection
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            View all the Pokemon cards you've created.
          </p>
        </div>

        {cards.length === 0 ? (
          <Card className="p-8 bg-white/10 backdrop-blur-sm border-gray-800 text-center">
            <div className="max-w-md mx-auto">
              <h2 className="text-xl font-semibold text-white mb-4">
                Your collection is empty
              </h2>
              <p className="text-gray-400 mb-6">
                Start creating your own custom Pokemon cards and build your
                unique collection!
              </p>
              <Button
                asChild
                className="bg-yellow-400 hover:bg-yellow-500 text-black"
              >
                <Link to="/create">
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Create Your First Card
                </Link>
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {cards.map((card, index) => (
                <div
                  key={`${card.name}-${index}`}
                  className="transform hover:scale-105 transition-all duration-300"
                >
                  <CardPreview data={card} />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  className="text-white border-gray-700 hover:bg-gray-800"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
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
                    ),
                  )}
                </div>
                <Button
                  variant="outline"
                  className="text-white border-gray-700 hover:bg-gray-800"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
