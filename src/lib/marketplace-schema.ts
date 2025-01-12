import { Timestamp } from 'firebase/firestore';
import { CardData } from '@/components/card-creator/types';
import { BoosterPack } from '@/components/booster-packs/types';

// Core marketplace interfaces
export interface Listing {
  id: string;
  type: 'card' | 'pack';
  itemId: string;
  item: CardData | BoosterPack;
  sellerId: string;
  sellerName: string;
  price: number;
  quantity: number;
  condition?: string;
  description?: string;
  status: 'active' | 'sold' | 'cancelled';
  // Stats
  views: number;
  likes: number;
  saves: number;
  lastViewedAt?: Timestamp;
  // Reviews
  rating: number;
  reviewCount: number;
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deliveryTime: string; // e.g., "24h"
  highlights?: {
    title: string;
    description: string;
    icon: string;
  }[];
}

export interface ListingLike {
  id: string;
  listingId: string;
  userId: string;
  createdAt: Timestamp;
}

export interface ListingReview {
  id: string;
  listingId: string;
  orderId: string;
  sellerId: string;  // ID of the seller being reviewed
  userId: string;    // ID of the reviewer
  userName: string;  // Display name of the reviewer
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  // Engagement
  helpfulCount: number;
  reportCount: number;
  // Metadata
  status: 'pending' | 'approved' | 'rejected';
  verified: boolean; // Whether the review is from a verified purchase
  createdAt: Timestamp;
  updatedAt: Timestamp;
  editedAt?: Timestamp;
}

export interface Order {
  id: string;
  buyerId: string;
  items: {
    listingId: string;
    sellerId: string;
    type: 'card' | 'pack';
    itemId: string;
    price: number;
    quantity: number;
    platformFee: number;
    sellerPayout: number;
    status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  }[];
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'disputed';
  totalAmount: number;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: {
    type: string;
    last4?: string;
    expiryMonth?: string;
    expiryYear?: string;
  };
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
}

export interface Transaction {
  id: string;
  orderId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  platformFee: number;
  sellerPayout: number;
  type: 'sale' | 'refund' | 'payout';
  status: 'pending' | 'completed' | 'failed';
  paymentMethod: string;
  createdAt: Timestamp;
  completedAt?: Timestamp;
}

export interface Inventory {
  id: string;
  sellerId: string;
  itemId: string;
  type: 'card' | 'pack';
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  condition?: string;
  location?: string;
  lastUpdated: Timestamp;
}

export interface Dispute {
  id: string;
  orderId: string;
  buyerId: string;
  sellerId: string;
  reason: string;
  description: string;
  evidence?: {
    type: string;
    url: string;
    description: string;
  }[];
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  resolution?: {
    type: 'refund' | 'replacement' | 'denied';
    amount?: number;
    notes?: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  resolvedAt?: Timestamp;
}

export interface UserProfile {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  // Seller specific
  isSeller: boolean;
  sellerRating?: number;
  totalSales?: number;
  totalRevenue?: number;
  // Stats
  joinedAt: Timestamp;
  lastActive: Timestamp;
  // Settings
  notificationPreferences: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

// Analytics interfaces
export interface SellerAnalytics {
  id: string;
  sellerId: string;
  // Daily stats
  dailyStats: {
    date: string;
    views: number;
    sales: number;
    revenue: number;
    newListings: number;
  }[];
  // Item performance
  itemPerformance: {
    [itemId: string]: {
      views: number;
      likes: number;
      saves: number;
      lastViewed: Timestamp;
    };
  };
  // Revenue stats
  revenue: {
    daily: number;
    weekly: number;
    monthly: number;
    total: number;
    byItemType: {
      card: number;
      pack: number;
    };
  };
  lastUpdated: Timestamp;
}

export interface MarketStats {
  id: string;
  // Overall stats
  totalListings: number;
  activeSales: number;
  totalSales: number;
  totalVolume: number;
  // Type breakdown
  byType: {
    card: {
      count: number;
      volume: number;
      averagePrice: number;
    };
    pack: {
      count: number;
      volume: number;
      averagePrice: number;
    };
  };
  // Time series
  hourlyStats: {
    timestamp: Timestamp;
    sales: number;
    volume: number;
    newListings: number;
  }[];
  // Popular items
  trending: {
    listingId: string;
    views: number;
    saves: number;
    lastUpdated: Timestamp;
  }[];
  lastUpdated: Timestamp;
}