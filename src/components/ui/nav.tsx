import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/marketplace/types";
import {
  Home,
  Plus,
  Library,
  PackageIcon,
  Store,
  ShoppingCart,
} from "lucide-react";

export function Nav() {
  const location = useLocation();
  const { itemCount, total } = useCart();

  const links = [
    { to: "/", icon: <Home className="w-5 h-5" />, label: "Home" },
    {
      to: "/create",
      icon: <Plus className="w-5 h-5" />,
      label: "Create Card",
    },
    {
      to: "/collection",
      icon: <Library className="w-5 h-5" />,
      label: "Collection",
    },
    {
      to: "/packs",
      icon: <PackageIcon className="w-5 h-5" />,
      label: "Booster Packs",
    },
    {
      to: "/marketplace",
      icon: <Store className="w-5 h-5" />,
      label: "Marketplace",
    },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-lg border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-1">
            {links.map((link) => (
              <Button
                key={link.to}
                asChild
                variant="ghost"
                className={`text-sm ${location.pathname === link.to ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
              >
                <Link to={link.to}>
                  {link.icon}
                  <span className="hidden sm:block ml-2">{link.label}</span>
                </Link>
              </Button>
            ))}
          </div>

          <Button
            asChild
            variant="ghost"
            className={`text-sm relative ${location.pathname === "/cart" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
          >
            <Link to="/cart">
              <ShoppingCart className="w-5 h-5" />
              <span className="hidden sm:block ml-2">Cart</span>
              {itemCount > 0 && (
                <>
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-yellow-400 text-black text-xs flex items-center justify-center sm:hidden">
                    {itemCount}
                  </span>
                  <span className="hidden sm:inline ml-2 text-yellow-400">
                    (${total.toFixed(2)})
                  </span>
                </>
              )}
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
