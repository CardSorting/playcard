import { useEffect, useRef } from 'react';

export default function Pricing() {
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/buy-button.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (buttonRef.current) {
      buttonRef.current.innerHTML = `
        <stripe-buy-button
          buy-button-id="buy_btn_1QgcqNIA2zQnWbn5qOgMN0Kn"
          publishable-key="pk_live_51QUxquIA2zQnWbn5txySqbpjig5QCKtDGaFMZNqLOD1YTqSB4E40XKWWghNFY8mgjsHmiz5R4EFIfYkRSn7JmIxf00Dtpx1IRS"
        >
        </stripe-buy-button>
      `;
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl font-bold mb-6">Unlock Premium Features</h1>
        <p className="text-xl text-gray-600 mb-12">
          Get access to exclusive card designs, expanded storage, and priority support
        </p>

        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-2xl p-8 text-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column - Pricing Details */}
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">Pro Plan</h2>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
              
              <div className="text-6xl font-bold">
                $10<span className="text-2xl font-medium">/month</span>
              </div>

              <ul className="space-y-4">
                <li className="flex items-center">
                  <svg className="w-6 h-6 text-white mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Premium card designs
                </li>
                <li className="flex items-center">
                  <svg className="w-6 h-6 text-white mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  10GB storage
                </li>
                <li className="flex items-center">
                  <svg className="w-6 h-6 text-white mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Priority support
                </li>
                <li className="flex items-center">
                  <svg className="w-6 h-6 text-white mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Exclusive community access
                </li>
              </ul>
            </div>

            {/* Right Column - Stripe Button */}
            <div className="flex items-center justify-center">
              <div className="w-full max-w-xs" ref={buttonRef} />
            </div>
          </div>

          <p className="mt-8 text-gray-200 text-sm text-center">
            Cancel anytime. 30-day money back guarantee.
          </p>
        </div>
      </div>
    </div>
  );
}
