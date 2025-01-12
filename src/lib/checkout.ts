import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  runTransaction,
  serverTimestamp,
  Timestamp,
  DocumentSnapshot,
  QuerySnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  CheckoutSession,
  ShippingAddress,
  SavedPaymentMethod,
  PaymentIntent,
  Fulfillment,
  ShippingRate,
  TaxRate,
} from './checkout-schema';

interface CartItemCheckout {
  id: string;
  quantity: number;
  price: number;
  sellerId: string;
}

// Create or update checkout session
export const createCheckoutSession = async (
  userId: string,
  cartItems: CartItemCheckout[],
) => {
  const checkoutData: Omit<CheckoutSession, 'id'> = {
    userId,
    cartItems: cartItems.map(item => ({
      listingId: item.id,
      quantity: item.quantity,
      price: item.price,
      sellerId: item.sellerId,
    })),
    subtotal: cartItems.reduce((total, item) => total + (item.price * item.quantity), 0),
    tax: 0, // Will be calculated based on shipping address
    shippingCost: 0, // Will be calculated based on shipping method
    total: 0, // Will be calculated after tax and shipping
    status: 'draft',
    currentStep: 'cart',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    expiresAt: new Timestamp(Timestamp.now().seconds + 3600, 0), // 1 hour expiry
  };

  const sessionRef = await addDoc(collection(db, 'checkoutSessions'), checkoutData);
  return { id: sessionRef.id, ...checkoutData };
};

// Save shipping address
export const saveShippingAddress = async (
  userId: string,
  address: Omit<ShippingAddress, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
) => {
  const addressData = {
    ...address,
    userId,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const addressRef = await addDoc(collection(db, 'shippingAddresses'), addressData);
  return { id: addressRef.id, ...addressData };
};

// Save payment method
export const savePaymentMethod = async (
  userId: string,
  paymentMethod: Omit<SavedPaymentMethod, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
) => {
  const paymentData = {
    ...paymentMethod,
    userId,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const paymentRef = await addDoc(collection(db, 'paymentMethods'), paymentData);
  return { id: paymentRef.id, ...paymentData };
};

// Update checkout session with shipping
export const updateCheckoutShipping = async (
  sessionId: string,
  shippingAddressId: string,
  shippingMethodId: string
) => {
  return runTransaction(db, async (transaction) => {
    const sessionRef = doc(db, 'checkoutSessions', sessionId);
    const sessionDoc = await transaction.get(sessionRef);
    
    if (!sessionDoc.exists()) {
      throw new Error('Checkout session not found');
    }
    
    const session = sessionDoc.data() as CheckoutSession;
    const addressRef = doc(db, 'shippingAddresses', shippingAddressId);
    const addressDoc = await transaction.get(addressRef);
    
    if (!addressDoc.exists()) {
      throw new Error('Shipping address not found');
    }
    
    const shippingRateRef = doc(db, 'shippingRates', shippingMethodId);
    const shippingRateDoc = await transaction.get(shippingRateRef);
    
    if (!shippingRateDoc.exists()) {
      throw new Error('Shipping method not found');
    }
    
    const shippingRate = shippingRateDoc.data() as ShippingRate;
    const address = addressDoc.data() as ShippingAddress;
    
    // Get tax rate outside the transaction since we can't query inside it
    const taxRate = await getTaxRate(address.country, address.state);
    const tax = session.subtotal * (taxRate?.rate || 0);
    const total = session.subtotal + tax + shippingRate.price;
    
    transaction.update(sessionRef, {
      selectedShippingAddressId: shippingAddressId,
      shippingAddress: address,
      shippingCost: shippingRate.price,
      tax,
      total,
      currentStep: 'payment',
      updatedAt: Timestamp.now(),
    });
    
    return {
      ...session,
      selectedShippingAddressId: shippingAddressId,
      shippingAddress: address,
      shippingCost: shippingRate.price,
      tax,
      total,
      currentStep: 'payment',
    };
  });
};

// Process payment and create order
export const processPayment = async (
  sessionId: string,
  paymentMethodId: string
) => {
  return runTransaction(db, async (transaction) => {
    const sessionRef = doc(db, 'checkoutSessions', sessionId);
    const sessionDoc = await transaction.get(sessionRef);
    
    if (!sessionDoc.exists()) {
      throw new Error('Checkout session not found');
    }
    
    const session = sessionDoc.data() as CheckoutSession;
    
    // Create payment intent
    const paymentIntent: Omit<PaymentIntent, 'id'> = {
      checkoutSessionId: sessionId,
      userId: session.userId,
      amount: session.total,
      currency: 'usd',
      paymentMethodId,
      status: 'requires_confirmation',
      metadata: {
        checkoutSessionId: sessionId,
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    const paymentIntentRef = await addDoc(collection(db, 'paymentIntents'), paymentIntent);
    
    // Create order
    const orderData = {
      userId: session.userId,
      items: session.cartItems,
      total: session.total,
      tax: session.tax,
      shippingCost: session.shippingCost,
      shippingAddress: session.shippingAddress,
      paymentIntentId: paymentIntentRef.id,
      status: 'pending',
      createdAt: Timestamp.now(),
    };
    
    const orderRef = await addDoc(collection(db, 'orders'), orderData);
    
    // Update payment intent with order ID
    transaction.update(paymentIntentRef, {
      metadata: {
        ...paymentIntent.metadata,
        orderId: orderRef.id,
      },
    });
    
    // Update checkout session
    transaction.update(sessionRef, {
      status: 'completed',
      completedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    
    return {
      orderId: orderRef.id,
      paymentIntentId: paymentIntentRef.id,
    };
  });
};

// Create fulfillment
export const createFulfillment = async (orderId: string) => {
  return runTransaction(db, async (transaction) => {
    const orderRef = doc(db, 'orders', orderId);
    const orderDoc = await transaction.get(orderRef);
    
    if (!orderDoc.exists()) {
      throw new Error('Order not found');
    }
    
    const order = orderDoc.data();
    
    const fulfillmentData: Omit<Fulfillment, 'id'> = {
      orderId,
      status: 'pending',
      shippingMethod: order.shippingMethod,
      shippingCost: order.shippingCost,
      items: order.items,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    const fulfillmentRef = await addDoc(collection(db, 'fulfillments'), fulfillmentData);
    
    // Update order status
    transaction.update(orderRef, {
      status: 'processing',
      updatedAt: Timestamp.now(),
    });
    
    return { id: fulfillmentRef.id, ...fulfillmentData };
  });
};

// Get available shipping rates
export const getShippingRates = async (countryCode: string, orderValue: number): Promise<ShippingRate[]> => {
  const ratesRef = collection(db, 'shippingRates');
  const q = query(
    ratesRef,
    where('isActive', '==', true),
    where('restrictions.countries', 'array-contains', countryCode)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as ShippingRate))
    .filter(rate => 
      (!rate.restrictions?.minOrderValue || orderValue >= rate.restrictions.minOrderValue) &&
      (!rate.restrictions?.maxOrderValue || orderValue <= rate.restrictions.maxOrderValue)
    );
};

// Get tax rate for location
export const getTaxRate = async (country: string, state: string, city?: string): Promise<TaxRate | null> => {
  const ratesRef = collection(db, 'taxRates');
  const constraints = [
    where('country', '==', country),
    where('state', '==', state),
    where('isActive', '==', true),
  ];
  
  if (city) {
    constraints.push(where('city', '==', city));
  }
  
  const q = query(ratesRef, ...constraints);
  const snapshot = await getDocs(q);
  const doc = snapshot.docs[0];
  
  return doc ? { id: doc.id, ...doc.data() } as TaxRate : null;
};