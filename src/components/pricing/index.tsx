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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Pricing</h1>
      <div className="max-w-md mx-auto" ref={buttonRef} />
    </div>
  );
}
