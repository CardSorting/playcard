import { Link } from "react-router-dom";
import { Home, Package, Library, Image, Sparkles, LogOut, Wand2 } from "lucide-react";
import { useAuth } from "@/lib/contexts/auth-context";
import { auth } from "@/lib/firebase";
import { Button } from "./button";

export default function Nav() {
  const { user } = useAuth();
  const linkClass = "flex items-center gap-2 text-gray-400 hover:text-white transition-colors";

  const handleSignOut = () => {
    auth.signOut();
  };

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
              {user && (
                <>
                  <Link to="/card-creator" className={linkClass}>
                    <Wand2 className="w-5 h-5" />
                    <span>Card Creator</span>
                  </Link>
                  <Link to="/booster-packs" className={linkClass}>
                    <Package className="w-5 h-5" />
                    <span>Booster Packs</span>
                  </Link>
                  <Link to="/claims" className={linkClass}>
                    <Sparkles className="w-5 h-5" />
                    <span>Claim Center</span>
                  </Link>
                  <Link to="/collection" className={linkClass}>
                    <Library className="w-5 h-5" />
                    <span>Collection</span>
                  </Link>
                  <Link to="/image-generator" className={linkClass}>
                    <Image className="w-5 h-5" />
                    <span>Image Generator</span>
                  </Link>
                </>
              )}
            </div>
          </div>
          <div>
            {user ? (
              <Button
                variant="ghost"
                className="text-gray-400 hover:text-white"
                onClick={handleSignOut}
              >
                <LogOut className="w-5 h-5 mr-2" />
                Sign Out
              </Button>
            ) : (
              <Button
                variant="ghost"
                className="text-gray-400 hover:text-white"
                asChild
              >
                <Link to="/login">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
