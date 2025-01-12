import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  runTransaction,
  Timestamp,
  increment,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  Cart,
  CartItem,
  CartAnalytics,
  CartValidation,
  CartRecovery,
  CartMerge,
} from './cart-schema';

// Get or create user's active cart
export const getOrCreateCart = async (userId: string): Promise<Cart> => {
  const cartsRef = collection(db, 'carts');
  const q = query(
    cartsRef,
    where('userId', '==', userId),
    where('status', '==', 'active')
  );
  
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    const cart = snapshot.docs[0];
    return { id: cart.id, ...cart.data() } as Cart;
  }
  
  // Create new cart
  const newCart: Omit<Cart, 'id'> = {
    userId,
    items: [],
    itemCount: 0,
    subtotal: 0,
    total: 0,
    status: 'active',
    lastUpdated: Timestamp.now(),
    createdAt: Timestamp.now(),
    lastActivityAt: Timestamp.now(),
    expiresAt: new Timestamp(Timestamp.now().seconds + 7 * 24 * 60 * 60, 0), // 7 days
  };
  
  const cartRef = await addDoc(cartsRef, newCart);
  return { id: cartRef.id, ...newCart };
};

// Add item to cart
export const addToCart = async (
  cartId: string,
  listingId: string,
  quantity: number
): Promise<CartItem> => {
  return runTransaction(db, async (transaction) => {
    // Get cart and listing
    const cartRef = doc(db, 'carts', cartId);
    const listingRef = doc(db, 'listings', listingId);
    
    const [cartDoc, listingDoc] = await Promise.all([
      transaction.get(cartRef),
      transaction.get(listingRef),
    ]);
    
    if (!cartDoc.exists()) {
      throw new Error('Cart not found');
    }
    if (!listingDoc.exists()) {
      throw new Error('Listing not found');
    }
    
    const cart = cartDoc.data() as Cart;
    const listing = listingDoc.data();
    
    // Validate listing
    if (listing.status !== 'active' || listing.quantity < quantity) {
      throw new Error('Item not available in requested quantity');
    }
    
    // Create cart item
    const cartItem: CartItem = {
      id: `${cartId}_${listingId}`,
      listingId,
      type: listing.type,
      quantity,
      price: listing.price,
      sellerId: listing.sellerId,
      itemSnapshot: {
        name: listing.name,
        description: listing.description,
        imageUrl: listing.imageUrl,
        type: listing.type === 'card' ? listing.cardType : undefined,
        condition: listing.condition,
      },
      maxQuantityAllowed: listing.quantity,
      inStock: true,
      priceValid: true,
      addedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    // Update cart
    const newSubtotal = cart.subtotal + (cartItem.price * quantity);
    
    transaction.update(cartRef, {
      items: arrayUnion(cartItem),
      itemCount: increment(quantity),
      subtotal: newSubtotal,
      total: newSubtotal, // Will be updated with tax/shipping during checkout
      lastUpdated: Timestamp.now(),
      lastActivityAt: Timestamp.now(),
    });
    
    // Create analytics entry
    const analyticsRef = collection(db, 'cartAnalytics');
    const analytics: Partial<CartAnalytics> = {
      cartId,
      userId: cart.userId,
      itemInteractions: {
        [listingId]: {
          addedAt: Timestamp.now(),
          quantityUpdates: [],
        },
      },
      stateChanges: [{
        timestamp: Timestamp.now(),
        action: 'add_item',
        details: { listingId, quantity },
      }],
      totalAddedItems: increment(1),
      lastUpdatedAt: Timestamp.now(),
    };
    
    transaction.set(doc(analyticsRef, cartId), analytics, { merge: true });
    
    return cartItem;
  });
};

// Update cart item quantity
export const updateCartItemQuantity = async (
  cartId: string,
  itemId: string,
  newQuantity: number
): Promise<void> => {
  return runTransaction(db, async (transaction) => {
    const cartRef = doc(db, 'carts', cartId);
    const cartDoc = await transaction.get(cartRef);
    
    if (!cartDoc.exists()) {
      throw new Error('Cart not found');
    }
    
    const cart = cartDoc.data() as Cart;
    const item = cart.items.find(i => i.id === itemId);
    
    if (!item) {
      throw new Error('Item not found in cart');
    }
    
    // Validate new quantity
    const listingRef = doc(db, 'listings', item.listingId);
    const listingDoc = await transaction.get(listingRef);
    
    if (!listingDoc.exists()) {
      throw new Error('Listing no longer exists');
    }
    
    const listing = listingDoc.data();
    if (listing.quantity < newQuantity) {
      throw new Error('Requested quantity not available');
    }
    
    // Calculate price difference
    const quantityDiff = newQuantity - item.quantity;
    const priceDiff = item.price * quantityDiff;
    
    // Update cart
    const updatedItems = cart.items.map(i => 
      i.id === itemId 
        ? { ...i, quantity: newQuantity, updatedAt: Timestamp.now() }
        : i
    );
    
    transaction.update(cartRef, {
      items: updatedItems,
      itemCount: increment(quantityDiff),
      subtotal: increment(priceDiff),
      total: increment(priceDiff),
      lastUpdated: Timestamp.now(),
      lastActivityAt: Timestamp.now(),
    });
    
    // Update analytics
    const analyticsRef = doc(db, 'cartAnalytics', cartId);
    transaction.set(analyticsRef, {
      [`itemInteractions.${item.listingId}.quantityUpdates`]: arrayUnion({
        timestamp: Timestamp.now(),
        oldQuantity: item.quantity,
        newQuantity,
      }),
      stateChanges: arrayUnion({
        timestamp: Timestamp.now(),
        action: 'update_quantity',
        details: { itemId, oldQuantity: item.quantity, newQuantity },
      }),
      quantityUpdateCount: increment(1),
      lastUpdatedAt: Timestamp.now(),
    }, { merge: true });
  });
};

// Remove item from cart
export const removeFromCart = async (
  cartId: string,
  itemId: string
): Promise<void> => {
  return runTransaction(db, async (transaction) => {
    const cartRef = doc(db, 'carts', cartId);
    const cartDoc = await transaction.get(cartRef);
    
    if (!cartDoc.exists()) {
      throw new Error('Cart not found');
    }
    
    const cart = cartDoc.data() as Cart;
    const item = cart.items.find(i => i.id === itemId);
    
    if (!item) {
      throw new Error('Item not found in cart');
    }
    
    // Update cart
    transaction.update(cartRef, {
      items: arrayRemove(item),
      itemCount: increment(-item.quantity),
      subtotal: increment(-(item.price * item.quantity)),
      total: increment(-(item.price * item.quantity)),
      lastUpdated: Timestamp.now(),
      lastActivityAt: Timestamp.now(),
    });
    
    // Update analytics
    const analyticsRef = doc(db, 'cartAnalytics', cartId);
    transaction.set(analyticsRef, {
      [`itemInteractions.${item.listingId}.removedAt`]: Timestamp.now(),
      stateChanges: arrayUnion({
        timestamp: Timestamp.now(),
        action: 'remove_item',
        details: { itemId, quantity: item.quantity },
      }),
      totalRemovedItems: increment(1),
      lastUpdatedAt: Timestamp.now(),
    }, { merge: true });
  });
};

// Clear cart
export const clearCart = async (cartId: string): Promise<void> => {
  return runTransaction(db, async (transaction) => {
    const cartRef = doc(db, 'carts', cartId);
    const cartDoc = await transaction.get(cartRef);
    
    if (!cartDoc.exists()) {
      throw new Error('Cart not found');
    }
    
    // Update cart
    transaction.update(cartRef, {
      items: [],
      itemCount: 0,
      subtotal: 0,
      total: 0,
      lastUpdated: Timestamp.now(),
      lastActivityAt: Timestamp.now(),
    });
    
    // Update analytics
    const analyticsRef = doc(db, 'cartAnalytics', cartId);
    transaction.set(analyticsRef, {
      stateChanges: arrayUnion({
        timestamp: Timestamp.now(),
        action: 'clear_cart',
      }),
      lastUpdatedAt: Timestamp.now(),
    }, { merge: true });
  });
};

// Validate cart
export const validateCart = async (cartId: string): Promise<CartValidation> => {
  return runTransaction(db, async (transaction) => {
    const cartRef = doc(db, 'carts', cartId);
    const cartDoc = await transaction.get(cartRef);
    
    if (!cartDoc.exists()) {
      throw new Error('Cart not found');
    }
    
    const cart = cartDoc.data() as Cart;
    const issues: CartValidation['issues'] = [];
    const actions: CartValidation['actions'] = [];
    
    // Check each item
    for (const item of cart.items) {
      const listingRef = doc(db, 'listings', item.listingId);
      const listingDoc = await transaction.get(listingRef);
      
      if (!listingDoc.exists()) {
        issues.push({
          type: 'error',
          code: 'item_not_found',
          message: 'Item no longer exists',
          itemId: item.id,
        });
        actions.push({
          timestamp: Timestamp.now(),
          type: 'remove_item',
          itemId: item.id,
          reason: 'item_not_found',
          oldValue: item,
          newValue: null,
        });
        continue;
      }
      
      const listing = listingDoc.data();
      
      // Check inventory
      if (listing.quantity < item.quantity) {
        issues.push({
          type: 'warning',
          code: 'insufficient_inventory',
          message: 'Requested quantity not available',
          itemId: item.id,
          details: { available: listing.quantity },
        });
        actions.push({
          timestamp: Timestamp.now(),
          type: 'update_quantity',
          itemId: item.id,
          reason: 'insufficient_inventory',
          oldValue: item.quantity,
          newValue: listing.quantity,
        });
      }
      
      // Check price
      if (listing.price !== item.price) {
        issues.push({
          type: 'warning',
          code: 'price_changed',
          message: 'Price has changed',
          itemId: item.id,
          details: { newPrice: listing.price },
        });
        actions.push({
          timestamp: Timestamp.now(),
          type: 'update_price',
          itemId: item.id,
          reason: 'price_changed',
          oldValue: item.price,
          newValue: listing.price,
        });
      }
    }
    
    const validation: CartValidation = {
      id: `${cartId}_${Date.now()}`,
      cartId,
      status: issues.length === 0 ? 'valid' : issues.some(i => i.type === 'error') ? 'invalid' : 'warning',
      timestamp: Timestamp.now(),
      checks: {
        inventoryAvailable: !issues.some(i => i.code === 'insufficient_inventory'),
        pricesValid: !issues.some(i => i.code === 'price_changed'),
        itemsExist: !issues.some(i => i.code === 'item_not_found'),
        sellersActive: true,
      },
      issues,
      actions,
    };
    
    // Store validation result
    const validationRef = doc(collection(db, 'cartValidations'), validation.id);
    transaction.set(validationRef, validation);
    
    return validation;
  });
};

// Merge carts (e.g., after user login)
export const mergeCarts = async (
  sourceCartId: string,
  targetCartId: string,
  strategy: CartMerge['strategy'] = 'keep_highest_quantity'
): Promise<CartMerge> => {
  return runTransaction(db, async (transaction) => {
    const [sourceCartDoc, targetCartDoc] = await Promise.all([
      transaction.get(doc(db, 'carts', sourceCartId)),
      transaction.get(doc(db, 'carts', targetCartId)),
    ]);
    
    if (!sourceCartDoc.exists() || !targetCartDoc.exists()) {
      throw new Error('One or both carts not found');
    }
    
    const sourceCart = sourceCartDoc.data() as Cart;
    const targetCart = targetCartDoc.data() as Cart;
    const conflicts: CartMerge['conflicts'] = [];
    const mergedItems = [...targetCart.items];
    let itemsAdded = 0;
    let itemsUpdated = 0;
    let itemsRemoved = 0;
    
    // Process source cart items
    for (const sourceItem of sourceCart.items) {
      const existingItem = mergedItems.find(i => i.listingId === sourceItem.listingId);
      
      if (existingItem) {
        // Handle conflict based on strategy
        let finalQuantity: number;
        switch (strategy) {
          case 'keep_newest':
            finalQuantity = sourceItem.updatedAt > existingItem.updatedAt 
              ? sourceItem.quantity 
              : existingItem.quantity;
            break;
          case 'keep_highest_quantity':
            finalQuantity = Math.max(sourceItem.quantity, existingItem.quantity);
            break;
          case 'combine_quantities':
            finalQuantity = sourceItem.quantity + existingItem.quantity;
            break;
        }
        
        conflicts.push({
          itemId: sourceItem.id,
          type: 'quantity_conflict',
          resolution: strategy,
          sourceValue: sourceItem.quantity,
          targetValue: existingItem.quantity,
          finalValue: finalQuantity,
        });
        
        // Update existing item
        const itemIndex = mergedItems.indexOf(existingItem);
        mergedItems[itemIndex] = {
          ...existingItem,
          quantity: finalQuantity,
          updatedAt: Timestamp.now(),
        };
        itemsUpdated++;
      } else {
        // Add new item
        mergedItems.push({
          ...sourceItem,
          id: `${targetCartId}_${sourceItem.listingId}`,
          updatedAt: Timestamp.now(),
        });
        itemsAdded++;
      }
    }
    
    // Calculate new totals
    const subtotal = mergedItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    // Update target cart
    transaction.update(doc(db, 'carts', targetCartId), {
      items: mergedItems,
      itemCount: mergedItems.reduce((count, item) => count + item.quantity, 0),
      subtotal,
      total: subtotal,
      lastUpdated: Timestamp.now(),
      lastActivityAt: Timestamp.now(),
    });
    
    // Mark source cart as merged
    transaction.update(doc(db, 'carts', sourceCartId), {
      status: 'converted',
      lastUpdated: Timestamp.now(),
    });
    
    // Create merge record
    const mergeRecord: CartMerge = {
      id: `${sourceCartId}_${targetCartId}`,
      userId: targetCart.userId,
      sourceCartId,
      targetCartId,
      status: 'completed',
      strategy,
      conflicts,
      results: {
        itemsAdded,
        itemsUpdated,
        itemsRemoved,
        totalDelta: subtotal - targetCart.subtotal,
      },
      createdAt: Timestamp.now(),
      completedAt: Timestamp.now(),
    };
    
    const mergeRef = doc(collection(db, 'cartMerges'), mergeRecord.id);
    transaction.set(mergeRef, mergeRecord);
    
    return mergeRecord;
  });
};