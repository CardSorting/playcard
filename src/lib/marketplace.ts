import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  increment,
  runTransaction,
  Timestamp,
  startAfter,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  Listing,
  Order,
  Transaction,
  Inventory,
  ListingReview,
  Dispute,
  UserProfile,
} from './marketplace-schema';

// Listings
export const createListing = async (listing: Omit<Listing, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'likes' | 'saves' | 'rating' | 'reviewCount'>) => {
  const listingData = {
    ...listing,
    views: 0,
    likes: 0,
    saves: 0,
    rating: 0,
    reviewCount: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  
  return runTransaction(db, async (transaction) => {
    // Check inventory
    const inventoryRef = doc(db, 'inventory', `${listing.sellerId}_${listing.itemId}`);
    const inventoryDoc = await transaction.get(inventoryRef);
    
    if (!inventoryDoc.exists() || inventoryDoc.data().availableQuantity < listing.quantity) {
      throw new Error('Insufficient inventory');
    }
    
    // Create listing
    const listingRef = await addDoc(collection(db, 'listings'), listingData);
    
    // Update inventory
    transaction.update(inventoryRef, {
      availableQuantity: increment(-listing.quantity),
      reservedQuantity: increment(listing.quantity),
    });
    
    return { id: listingRef.id, ...listingData };
  });
};

export const getListings = async (filters: {
  type?: 'card' | 'pack';
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  sellerId?: string;
  status?: string;
  limit?: number;
  lastVisible?: any;
}) => {
  const constraints = [];
  
  if (filters.type) constraints.push(where('type', '==', filters.type));
  if (filters.minPrice) constraints.push(where('price', '>=', filters.minPrice));
  if (filters.maxPrice) constraints.push(where('price', '<=', filters.maxPrice));
  if (filters.condition) constraints.push(where('condition', '==', filters.condition));
  if (filters.sellerId) constraints.push(where('sellerId', '==', filters.sellerId));
  if (filters.status) constraints.push(where('status', '==', filters.status));
  
  constraints.push(orderBy('createdAt', 'desc'));
  if (filters.limit) constraints.push(limit(filters.limit));
  if (filters.lastVisible) constraints.push(startAfter(filters.lastVisible));
  
  const q = query(collection(db, 'listings'), ...constraints);
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Orders
export const createOrder = async (
  buyerId: string,
  items: { listingId: string; quantity: number }[],
  shippingAddress: Order['shippingAddress'],
  paymentMethod: Order['paymentMethod']
) => {
  return runTransaction(db, async (transaction) => {
    let totalAmount = 0;
    const orderItems = [];
    const inventoryUpdates = new Map();
    
    // Validate listings and calculate totals
    for (const item of items) {
      const listingRef = doc(db, 'listings', item.listingId);
      const listingDoc = await transaction.get(listingRef);
      
      if (!listingDoc.exists()) {
        throw new Error(`Listing ${item.listingId} not found`);
      }
      
      const listing = listingDoc.data() as Listing;
      if (listing.status !== 'active' || listing.quantity < item.quantity) {
        throw new Error(`Listing ${item.listingId} is not available`);
      }
      
      const platformFee = listing.price * 0.05; // 5% platform fee
      const sellerPayout = listing.price - platformFee;
      
      orderItems.push({
        listingId: item.listingId,
        sellerId: listing.sellerId,
        type: listing.type,
        itemId: listing.itemId,
        price: listing.price,
        quantity: item.quantity,
        platformFee,
        sellerPayout,
        status: 'pending'
      });
      
      totalAmount += listing.price * item.quantity;
      
      // Track inventory updates
      const inventoryKey = `${listing.sellerId}_${listing.itemId}`;
      const currentUpdate = inventoryUpdates.get(inventoryKey) || { reserved: 0, available: 0 };
      inventoryUpdates.set(inventoryKey, {
        reserved: currentUpdate.reserved - item.quantity,
        available: currentUpdate.available - item.quantity
      });
    }
    
    // Create order
    const orderData: Omit<Order, 'id'> = {
      buyerId,
      items: orderItems,
      status: 'pending',
      totalAmount,
      paymentStatus: 'pending',
      paymentMethod,
      shippingAddress,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    const orderRef = await addDoc(collection(db, 'orders'), orderData);
    
    // Update inventory
    for (const [inventoryId, updates] of inventoryUpdates.entries()) {
      const inventoryRef = doc(db, 'inventory', inventoryId);
      transaction.update(inventoryRef, {
        reservedQuantity: increment(updates.reserved),
        availableQuantity: increment(updates.available)
      });
    }
    
    return { id: orderRef.id, ...orderData };
  });
};

// Reviews
export const createReview = async (review: Omit<ListingReview, 'id' | 'createdAt' | 'updatedAt' | 'helpfulCount' | 'reportCount'>) => {
  const reviewData = {
    ...review,
    helpfulCount: 0,
    reportCount: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  
  return runTransaction(db, async (transaction) => {
    // Verify order exists and belongs to reviewer
    const orderRef = doc(db, 'orders', review.orderId);
    const orderDoc = await transaction.get(orderRef);
    
    if (!orderDoc.exists() || orderDoc.data().buyerId !== review.userId) {
      throw new Error('Invalid order');
    }
    
    // Create review
    const reviewRef = await addDoc(collection(db, 'reviews'), reviewData);
    
    // Update seller rating
    const sellerRef = doc(db, 'users', review.sellerId);
    const sellerDoc = await transaction.get(sellerRef);
    const sellerData = sellerDoc.data() as UserProfile;
    
    const currentRating = sellerData.sellerRating || 0;
    const totalReviews = sellerData.totalSales || 0;
    const newRating = ((currentRating * totalReviews) + review.rating) / (totalReviews + 1);
    
    transaction.update(sellerRef, {
      sellerRating: newRating,
      totalSales: increment(1)
    });
    
    return { id: reviewRef.id, ...reviewData };
  });
};

// Disputes
export const createDispute = async (dispute: Omit<Dispute, 'id' | 'createdAt' | 'updatedAt'>) => {
  const disputeData = {
    ...dispute,
    status: 'open',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  
  return runTransaction(db, async (transaction) => {
    // Verify order exists and belongs to buyer
    const orderRef = doc(db, 'orders', dispute.orderId);
    const orderDoc = await transaction.get(orderRef);
    
    if (!orderDoc.exists() || orderDoc.data().buyerId !== dispute.buyerId) {
      throw new Error('Invalid order');
    }
    
    // Create dispute
    const disputeRef = await addDoc(collection(db, 'disputes'), disputeData);
    
    // Update order status
    transaction.update(orderRef, {
      status: 'disputed',
      updatedAt: Timestamp.now()
    });
    
    return { id: disputeRef.id, ...disputeData };
  });
};

// Analytics
export const incrementListingViews = async (listingId: string) => {
  const listingRef = doc(db, 'listings', listingId);
  await updateDoc(listingRef, {
    views: increment(1),
    lastViewedAt: Timestamp.now()
  });
};

export const toggleListingLike = async (listingId: string, userId: string) => {
  const likeRef = doc(db, `listings/${listingId}/likes`, userId);
  const likeDoc = await getDoc(likeRef);
  
  if (likeDoc.exists()) {
    await runTransaction(db, async (transaction) => {
      transaction.delete(likeRef);
      transaction.update(doc(db, 'listings', listingId), {
        likes: increment(-1)
      });
    });
    return false;
  } else {
    await runTransaction(db, async (transaction) => {
      transaction.set(likeRef, { createdAt: Timestamp.now() });
      transaction.update(doc(db, 'listings', listingId), {
        likes: increment(1)
      });
    });
    return true;
  }
};