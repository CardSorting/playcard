import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import CardPreview from "@/components/card-creator/CardPreview";
import { CardData, PokemonType } from "@/components/card-creator/types";

export default function Home() {
  const demoCard: Partial<CardData> = {
    name: "Charizard",
    type: "Fire" as PokemonType,
    image:
      "https://images.unsplash.com/photo-1628968434441-d9c1c66dcde3?w=800&auto=format&fit=crop",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1613771404784-3a5686aa2be3')] bg-cover bg-center opacity-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
                Create Your Own{" "}
                <span className="text-yellow-400">Pokemon Cards</span>
              </h1>
              <p className="text-xl text-gray-300">
                Design and customize unique Pokemon cards with our intuitive
                card creator. Choose types, add images, and bring your ideas to
                life.
              </p>
              <div className="flex gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-yellow-400 hover:bg-yellow-500 text-black"
                >
                  <Link to="/login">Start Creating</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="text-white border-white hover:bg-white/10"
                >
                  <Link to="#features">Learn More</Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 blur-2xl bg-yellow-400/20 rounded-full" />
              <div className="relative transform hover:scale-105 transition-transform duration-300">
                <CardPreview data={demoCard} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Powerful Features
            </h2>
            <p className="mt-4 text-lg text-gray-400">
              Everything you need to create amazing Pokemon cards
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-lg bg-gray-800/50 backdrop-blur-sm"
              >
                <div className="w-12 h-12 rounded-full bg-yellow-400/10 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-yellow-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-black mb-8">
            Ready to Create Your Cards?
          </h2>
          <p className="text-xl text-gray-800 mb-8 max-w-2xl mx-auto">
            Join thousands of Pokemon fans who are already creating their own
            unique cards.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-black text-white hover:bg-gray-900"
          >
            <Link to="/login">Start Creating Now</Link>
          </Button>
          <div className="mt-8">
            <script async
              src="https://js.stripe.com/v3/buy-button.js">
            </script>
            <stripe-buy-button
              buy-button-id="buy_btn_1QgcqNIA2zQnWbn5qOgMN0Kn"
              publishable-key="pk_live_51QUxquIA2zQnWbn5txySqbpjig5QCKtDGaFMZNqLOD1YTqSB4E40XKWWghNFY8mgjsHmiz5R4EFIfYkRSn7JmIxf00Dtpx1IRS"
            >
            </stripe-buy-button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-400">
            <p>© 2024 Pokemon Card Creator. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    title: "Custom Card Design",
    description:
      "Choose from 18 different Pokemon types, each with unique visual effects and patterns.",
    icon: (
      <svg
        className="w-6 h-6 text-yellow-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
    ),
  },
  {
    title: "Image Upload",
    description:
      "Upload your own images or use URLs to create personalized Pokemon cards.",
    icon: (
      <svg
        className="w-6 h-6 text-yellow-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    title: "Real-time Preview",
    description:
      "See your changes instantly with our live preview feature as you customize your card.",
    icon: (
      <svg
        className="w-6 h-6 text-yellow-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </svg>
    ),
  },
];
