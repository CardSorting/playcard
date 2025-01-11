import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreditCard, Lock } from "lucide-react";

export default function PaymentForm() {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i);
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    return month < 10 ? `0${month}` : `${month}`;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">
          Payment Information
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Lock className="w-4 h-4" />
          <span>Secure Payment</span>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="space-y-2">
          <Label htmlFor="cardNumber">Card Number</Label>
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="cardNumber"
              placeholder="4242 4242 4242 4242"
              className="pl-11 bg-white/5 border-gray-700 text-white"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Expiration Date</Label>
            <div className="grid grid-cols-2 gap-2">
              <Select>
                <SelectTrigger className="bg-white/5 border-gray-700 text-white">
                  <SelectValue placeholder="MM" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select>
                <SelectTrigger className="bg-white/5 border-gray-700 text-white">
                  <SelectValue placeholder="YYYY" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cvv">CVV</Label>
            <Input
              id="cvv"
              placeholder="123"
              maxLength={4}
              className="bg-white/5 border-gray-700 text-white"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nameOnCard">Name on Card</Label>
          <Input
            id="nameOnCard"
            placeholder="John Doe"
            className="bg-white/5 border-gray-700 text-white"
          />
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-800">
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <p>We accept:</p>
          <div className="flex items-center gap-2">
            <div className="w-12 h-8 bg-white/5 rounded flex items-center justify-center text-white font-medium">
              Visa
            </div>
            <div className="w-12 h-8 bg-white/5 rounded flex items-center justify-center text-white font-medium">
              MC
            </div>
            <div className="w-12 h-8 bg-white/5 rounded flex items-center justify-center text-white font-medium">
              Amex
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
