import { Timestamp } from 'firebase/firestore';

// Saved Payment Methods
export interface SavedPaymentMethod {
  id: string;
  userId: string;
  type: 'card' | 'paypal';
  isDefault: boolean;
  // Card specific fields
  cardType?: 'visa' | 'mastercard' | 'amex';
  last4?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cardholderName?: string;
  // PayPal specific fields
  paypalEmail?: string;
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Saved Shipping Addresses
export interface ShippingAddress {
  id: string;
  userId: string;
  isDefault: boolean;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Checkout Session
export interface CheckoutSession {
  id: string;
  userId: string;
  cartItems: {
    listingId: string;
    quantity: number;
    price: number;
    sellerId: string;
  }[];
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  selectedPaymentMethodId?: string;
  selectedShippingAddressId?: string;
  status: 'draft' | 'processing' | 'completed' | 'failed' | 'abandoned';
  // Step tracking
  currentStep: 'cart' | 'shipping' | 'payment' | 'confirmation';
  shippingAddress?: ShippingAddress;
  paymentMethod?: SavedPaymentMethod;
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  expiresAt: Timestamp;
  completedAt?: Timestamp;
}

// Payment Processing
export interface PaymentIntent {
  id: string;
  checkoutSessionId: string;
  userId: string;
  amount: number;
  currency: string;
  paymentMethodId: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'processing' | 'succeeded' | 'failed';
  error?: {
    code: string;
    message: string;
  };
  metadata: {
    orderId?: string;
    checkoutSessionId: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  succeededAt?: Timestamp;
}

// Shipping Rates
export interface ShippingRate {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: {
    min: number;
    max: number;
  };
  isActive: boolean;
  restrictions?: {
    countries?: string[];
    minOrderValue?: number;
    maxOrderValue?: number;
    maxWeight?: number;
  };
}

// Tax Rates
export interface TaxRate {
  id: string;
  name: string;
  rate: number;
  country: string;
  state?: string;
  city?: string;
  zipCode?: string;
  isActive: boolean;
  metadata?: {
    taxCategory?: string;
    taxJurisdiction?: string;
  };
}

// Order Fulfillment
export interface Fulfillment {
  id: string;
  orderId: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'failed';
  trackingNumber?: string;
  carrier?: string;
  shippingMethod: string;
  shippingCost: number;
  estimatedDeliveryDate?: Timestamp;
  actualDeliveryDate?: Timestamp;
  items: {
    listingId: string;
    quantity: number;
  }[];
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  shippedAt?: Timestamp;
  deliveredAt?: Timestamp;
}

// Refund
export interface Refund {
  id: string;
  orderId: string;
  paymentIntentId: string;
  amount: number;
  reason: 'requested_by_customer' | 'duplicate' | 'fraudulent' | 'order_change' | 'other';
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
  items?: {
    listingId: string;
    quantity: number;
    amount: number;
  }[];
  metadata?: {
    disputeId?: string;
    notes?: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  succeededAt?: Timestamp;
}

// Checkout Analytics
export interface CheckoutAnalytics {
  id: string;
  checkoutSessionId: string;
  userId: string;
  startedAt: Timestamp;
  completedAt?: Timestamp;
  abandonedAt?: Timestamp;
  steps: {
    cart: {
      enteredAt: Timestamp;
      exitedAt?: Timestamp;
      itemCount: number;
      totalValue: number;
    };
    shipping: {
      enteredAt?: Timestamp;
      exitedAt?: Timestamp;
      selectedMethod?: string;
    };
    payment: {
      enteredAt?: Timestamp;
      exitedAt?: Timestamp;
      selectedMethod?: string;
      attempts?: number;
      errors?: string[];
    };
  };
  device: {
    type: 'mobile' | 'tablet' | 'desktop';
    browser: string;
    os: string;
  };
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
  };
}