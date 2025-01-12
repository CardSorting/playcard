import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useCart } from "../types";
import { CardData } from "@/components/card-creator/types";
import { useAuth } from "@/lib/contexts/auth-context";
import { createCheckoutSession, processPayment, updateCheckoutShipping } from "@/lib/checkout";
import { addCardToCollection } from "@/lib/collection";
import CheckoutSummary from "./summary";
import PaymentForm from "./payment-form";
import ShippingForm from "./shipping-form";
import { ArrowLeft, ArrowRight } from "lucide-react";

type CheckoutStep = "summary" | "shipping" | "payment" | "confirmation";

export default function Checkout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("summary");
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const initCheckout = async () => {
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to proceed with checkout.",
          variant: "destructive",
        });
        navigate("/cart");
        return;
      }

      if (items.length === 0) return;

      try {
        const cartItems = items.map(item => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price || 0,
          sellerId: item.sellerId || user.uid,
        }));

        const session = await createCheckoutSession(user.uid, cartItems);
        setSessionId(session.id);
      } catch (error) {
        console.error("Error creating checkout session:", error);
        toast({
          title: "Error",
          description: "Failed to initialize checkout. Please try again.",
          variant: "destructive",
        });
        navigate("/cart");
      }
    };

    initCheckout();
  }, [user, items, navigate, toast]);

  const steps: { id: CheckoutStep; label: string }[] = [
    { id: "summary", label: "Order Summary" },
    { id: "shipping", label: "Shipping Info" },
    { id: "payment", label: "Payment" },
    { id: "confirmation", label: "Confirmation" },
  ];

  const handleNext = () => {
    const currentIndex = steps.findIndex((step) => step.id === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    }
  };

  const handleBack = () => {
    const currentIndex = steps.findIndex((step) => step.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    } else {
      navigate("/cart");
    }
  };

  const handleShippingSubmit = async (shippingData: any) => {
    if (!sessionId || !user) return;

    setIsProcessing(true);
    try {
      await updateCheckoutShipping(
        sessionId,
        shippingData.addressId,
        shippingData.methodId
      );
      handleNext();
    } catch (error) {
      console.error("Error updating shipping:", error);
      toast({
        title: "Error",
        description: "Failed to save shipping information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleComplete = async () => {
    if (!sessionId || !user || items.length === 0) return;

    setIsProcessing(true);
    try {
      const { orderId } = await processPayment(sessionId, "payment-method-id");

      // Add items to collections
      for (const item of items) {
        if (item.type === "card") {
          const cardItem = item.item as CardData;
          await addCardToCollection(user.uid, item.id, {
            name: cardItem.name,
            type: cardItem.type,
            imageUrl: cardItem.image,
            rarity: cardItem.rarity,
          });
        } else if (item.type === "pack" && "packType" in item.item) {
          // TODO: Implement booster pack collection logic when ready
          console.log("Booster pack purchased:", item.item);
        }
      }

      clearCart();
      setCurrentStep("confirmation");
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error processing your purchase.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0 && currentStep !== "confirmation") {
    navigate("/cart");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-3xl mx-auto pt-20 px-4 sm:px-6 lg:px-8 pb-24">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex-1 ${index !== steps.length - 1 ? "relative" : ""}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === step.id ? "bg-yellow-400 text-black" : "bg-white/5 text-gray-400"} relative z-10`}
                >
                  {index + 1}
                </div>
                {index !== steps.length - 1 && (
                  <div
                    className={`absolute top-4 -translate-y-1/2 left-8 right-0 h-[2px] ${steps.findIndex((s) => s.id === currentStep) > index ? "bg-yellow-400" : "bg-gray-700"}`}
                  />
                )}
                <p
                  className={`mt-2 text-xs ${currentStep === step.id ? "text-yellow-400" : "text-gray-500"}`}
                >
                  {step.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <Card className="p-6 bg-white/10 backdrop-blur-sm border-gray-800">
          {currentStep === "summary" && <CheckoutSummary />}
          {currentStep === "shipping" && <ShippingForm />}
          {currentStep === "payment" && <PaymentForm />}
          {currentStep === "confirmation" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-400/10 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Order Confirmed!
              </h2>
              <p className="text-gray-400 mb-6">
                Your items have been added to your collection.
              </p>
              <Button
                onClick={() => navigate("/collection")}
                className="bg-yellow-400 hover:bg-yellow-500 text-black"
              >
                View Collection
              </Button>
            </div>
          )}

          {/* Navigation */}
          {currentStep !== "confirmation" && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-800">
              <Button
                variant="outline"
                className="text-white border-gray-700 hover:bg-gray-800"
                onClick={handleBack}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              {currentStep === "payment" ? (
                <Button
                  className="bg-yellow-400 hover:bg-yellow-500 text-black"
                  onClick={handleComplete}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing..." : "Complete Order"}
                </Button>
              ) : (
                <Button
                  className="bg-yellow-400 hover:bg-yellow-500 text-black"
                  onClick={handleNext}
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
