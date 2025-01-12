import { Timestamp, FieldValue } from 'firebase/firestore';

// Cart
export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  total: number;
  lastUpdated: Timestamp;
  status: 'active' | 'abandoned' | 'converted';
  // Metadata
  createdAt: Timestamp;
  lastActivityAt: Timestamp;
  expiresAt?: Timestamp;
}

// Cart Item
export interface CartItem {
  id: string;
  listingId: string;
  type: 'card' | 'pack';
  quantity: number;
  price: number;
  sellerId: string;
  // Item details snapshot
  itemSnapshot: {
    name: string;
    description?: string;
    imageUrl?: string;
    type?: string; // For cards
    condition?: string;
  };
  // Validation
  maxQuantityAllowed: number;
  inStock: boolean;
  priceValid: boolean;
  addedAt: Timestamp;
  updatedAt: Timestamp;
}

// Cart Analytics
export interface CartAnalytics {
  id: string;
  cartId: string;
  userId: string;
  // Session data
  sessionId: string;
  deviceInfo: {
    type: 'mobile' | 'tablet' | 'desktop';
    browser: string;
    os: string;
  };
  // Item interactions
  itemInteractions: {
    [itemId: string]: {
      addedAt: Timestamp;
      removedAt?: Timestamp;
      quantityUpdates: {
        timestamp: Timestamp;
        oldQuantity: number;
        newQuantity: number;
      }[];
    };
  };
  // Cart state changes
  stateChanges: {
    timestamp: Timestamp;
    action: 'add_item' | 'remove_item' | 'update_quantity' | 'clear_cart' | 'checkout' | 'abandon';
    details?: any;
  }[];
  // Totals
  totalAddedItems: number | FieldValue;
  totalRemovedItems: number | FieldValue;
  quantityUpdateCount: number | FieldValue;
  // Timestamps
  createdAt: Timestamp;
  lastUpdatedAt: Timestamp;
  checkoutStartedAt?: Timestamp;
  checkoutCompletedAt?: Timestamp;
  abandonedAt?: Timestamp;
}

// Cart Recovery
export interface CartRecovery {
  id: string;
  cartId: string;
  userId: string;
  status: 'pending' | 'sent' | 'clicked' | 'converted' | 'expired';
  // Recovery details
  recoveryType: 'email' | 'notification' | 'reminder';
  recoveryMethod: {
    email?: string;
    pushToken?: string;
  };
  // Content
  content: {
    subject?: string;
    message: string;
    incentive?: {
      type: 'discount' | 'free_shipping';
      value: number;
      code: string;
      expiresAt: Timestamp;
    };
  };
  // Tracking
  attempts: {
    timestamp: Timestamp;
    type: string;
    success: boolean;
    error?: string;
  }[];
  // Timestamps
  createdAt: Timestamp;
  scheduledFor: Timestamp;
  sentAt?: Timestamp;
  clickedAt?: Timestamp;
  convertedAt?: Timestamp;
  expiresAt: Timestamp;
}

// Cart Validation
export interface CartValidation {
  id: string;
  cartId: string;
  status: 'valid' | 'invalid' | 'warning';
  timestamp: Timestamp;
  checks: {
    inventoryAvailable: boolean;
    pricesValid: boolean;
    itemsExist: boolean;
    sellersActive: boolean;
  };
  issues: {
    type: 'error' | 'warning';
    code: string;
    message: string;
    itemId?: string;
    details?: any;
  }[];
  // Automatic actions taken
  actions: {
    timestamp: Timestamp;
    type: 'remove_item' | 'update_quantity' | 'update_price';
    itemId: string;
    reason: string;
    oldValue: any;
    newValue: any;
  }[];
}

// Cart Merge
export interface CartMerge {
  id: string;
  userId: string;
  sourceCartId: string;
  targetCartId: string;
  status: 'pending' | 'completed' | 'failed';
  // Merge details
  strategy: 'keep_newest' | 'keep_highest_quantity' | 'combine_quantities';
  conflicts: {
    itemId: string;
    type: 'quantity_conflict' | 'price_change' | 'item_unavailable';
    resolution: string;
    sourceValue: any;
    targetValue: any;
    finalValue: any;
  }[];
  // Results
  results: {
    itemsAdded: number;
    itemsUpdated: number;
    itemsRemoved: number;
    totalDelta: number;
  };
  // Timestamps
  createdAt: Timestamp;
  completedAt?: Timestamp;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}