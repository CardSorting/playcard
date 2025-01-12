import { Link } from "react-router-dom";
import { Home, Package, ShoppingCart, Image, Sparkles } from "lucide-react";

export default function Nav() {
  const linkClass = "flex items-center gap-2 text-gray-400 hover:text-white transition-colors";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-white font-bold">
              PlayCard
            </Link>
            <div className="flex items-center gap-6">
              <Link to="/" className={linkClass}>
                <Home className="w-5 h-5" />
                <span>Home</span>
              </Link>
              <Link to="/booster-packs" className={linkClass}>
                <Package className="w-5 h-5" />
                <span>Booster Packs</span>
              </Link>
              <Link to="/claims" className={linkClass}>
                <Sparkles className="w-5 h-5" />
                <span>Claim Center</span>
              </Link>
              <Link to="/marketplace" className={linkClass}>
                <ShoppingCart className="w-5 h-5" />
                <span>Marketplace</span>
              </Link>
              <Link to="/image-generator" className={linkClass}>
                <Image className="w-5 h-5" />
                <span>Image Generator</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
