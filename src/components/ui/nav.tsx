import { Link } from "react-router-dom";
import { Button } from "./button";
import {
  PlusIcon,
  LayersIcon,
  PackageIcon,
  ShoppingBagIcon,
} from "lucide-react";

export function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            to="/"
            className="text-xl font-bold text-white hover:text-yellow-400 transition-colors"
          >
            Pokemon Card Creator
          </Link>
          <div className="flex items-center gap-4">
            <Button
              asChild
              variant="ghost"
              className="text-white hover:bg-white/5"
            >
              <Link to="/collection">
                <LayersIcon className="w-5 h-5 mr-2" />
                Collection
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="text-white hover:bg-white/5"
            >
              <Link to="/packs">
                <PackageIcon className="w-5 h-5 mr-2" />
                Packs
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="text-white hover:bg-white/5"
            >
              <Link to="/marketplace">
                <ShoppingBagIcon className="w-5 h-5 mr-2" />
                Market
              </Link>
            </Button>
            <Button
              asChild
              className="bg-yellow-400 hover:bg-yellow-500 text-black"
            >
              <Link to="/create">
                <PlusIcon className="w-5 h-5 mr-2" />
                Create
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
