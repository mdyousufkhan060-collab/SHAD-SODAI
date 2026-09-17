import { Product } from '../types';
import { PRODUCTS } from '../data';
import { offerService } from './offerService';
import { accountService } from './accountService';
import { productService } from './productService';

export interface CartItem {
  productId: string;
  variantId?: number;
  variantName?: string;
  quantity: number;
  price: number; // validated server-side
  addedAt: string;
}

export interface WishlistItem {
  productId: string;
  addedAt: string;
}

const CART_KEY = 'mysql_simulated_cart';
const BUY_NOW_KEY = 'mysql_simulated_buy_now';

// Help helper to get unique storage key for a customer's private wishlist
const getWishlistKey = async (): Promise<string> => {
  const user = await accountService.getLoggedInUser();
  if (user) {
    return `mysql_simulated_wishlist_user_${user.id}`;
  }
  return 'mysql_simulated_wishlist_guest';
};

export const cartService = {
  // 1. GET CART ITEMS
  getCartItems(): CartItem[] {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    } catch {
      return [];
    }
  },

  // 1.5. GET WISHLIST ITEMS
  async getWishlistItems(): Promise<WishlistItem[]> {
    try {
      const key = await getWishlistKey();
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
      return [];
    }
  },

  async toggleWishlist(productId: string): Promise<boolean> {
    const key = await getWishlistKey();
    let list = await this.getWishlistItems();
    const index = list.findIndex(i => i.productId === productId);
    if (index === -1) {
      list.push({ productId, addedAt: new Date().toISOString() });
    } else {
      list.splice(index, 1);
    }
    localStorage.setItem(key, JSON.stringify(list));
    return index === -1;
  },

  async isInWishlist(productId: string): Promise<boolean> {
    const list = await this.getWishlistItems();
    return list.some(i => i.productId === productId);
  },

  // 2. SECURE ADD TO CART WITH SERVER-SIDE LIKE VALIDATIONS
  addToCart(productId: string, quantity: number, variantId?: number): { success: boolean; message: string; cartCount: number } {
    // A. Validate product existence
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) {
      return { success: false, message: 'Product not found', cartCount: this.getCartCount() };
    }

    let availableStock = offerService.getInventoryStock(productId);
    let validatedPrice = 0;
    let variantName = '';

    // Automatically resolve default active variant if the product has variants but none was specified (Rule 24)
    if (!variantId) {
      const pVariants = productService.getProductVariants(productId);
      if (pVariants && pVariants.length > 0) {
        const defaultVar = pVariants.find(v => v.is_default && v.is_active) || pVariants.find(v => v.is_active);
        if (defaultVar) {
          variantId = defaultVar.id;
        }
      }
    }

    // If variantId is supplied, validate it securely (Rule 10)
    if (variantId) {
      const variant = productService.getVariantById(variantId);
      if (!variant || variant.product_id !== productId || !variant.is_active) {
        return { success: false, message: 'Invalid or inactive product variant selected.', cartCount: this.getCartCount() };
      }
      availableStock = variant.stock_quantity;
      validatedPrice = variant.price;
      variantName = variant.name;
    } else {
      // Base product fallback validation
      const activeOffers = offerService.getActiveOffers();
      let appliedOfferId = 0;
      for (const offer of activeOffers) {
        const pids = offerService.getOfferProducts(offer.id).map(p => p.id);
        if (pids.includes(productId)) {
          appliedOfferId = offer.id;
          break;
        }
      }
      const priceDetails = offerService.getCalculatedProductPrice(productId, appliedOfferId);
      validatedPrice = priceDetails.price;
    }

    // B. Validate real-time stock
    if (availableStock <= 0) {
      return { success: false, message: 'Sorry, this product size is completely out of stock!', cartCount: this.getCartCount() };
    }

    const currentCart = this.getCartItems();
    const existingIndex = currentCart.findIndex(item => item.productId === productId && item.variantId === variantId);
    const existingQuantity = existingIndex > -1 ? currentCart[existingIndex].quantity : 0;
    const requestedTotal = existingQuantity + quantity;

    if (requestedTotal > availableStock) {
      return { 
        success: false, 
        message: `Cannot add more items. Only ${availableStock} units available in stock.`,
        cartCount: this.getCartCount() 
      };
    }

    // D. Persist item to cart
    if (existingIndex > -1) {
      currentCart[existingIndex].quantity = requestedTotal;
      currentCart[existingIndex].price = validatedPrice; // secure update
    } else {
      currentCart.push({
        productId,
        variantId,
        variantName,
        quantity,
        price: validatedPrice,
        addedAt: new Date().toISOString()
      });
    }

    localStorage.setItem(CART_KEY, JSON.stringify(currentCart));

    // E. Emit window event for reactive header update
    window.dispatchEvent(new Event('cart-updated'));

    return { 
      success: true, 
      message: 'Product added to cart successfully!', 
      cartCount: this.getCartCount() 
    };
  },

  // Update existing quantity
  updateCartQuantity(productId: string, quantity: number, variantId?: number): boolean {
    if (quantity < 1) return this.removeFromCart(productId, variantId);

    let availableStock = offerService.getInventoryStock(productId);
    if (variantId) {
      const variant = productService.getVariantById(variantId);
      if (variant) {
        availableStock = variant.stock_quantity;
      }
    }

    if (quantity > availableStock) return false;

    const currentCart = this.getCartItems();
    const existingIndex = currentCart.findIndex(item => item.productId === productId && item.variantId === variantId);
    if (existingIndex > -1) {
      currentCart[existingIndex].quantity = quantity;
      localStorage.setItem(CART_KEY, JSON.stringify(currentCart));
      window.dispatchEvent(new Event('cart-updated'));
      return true;
    }
    return false;
  },

  // Remove from cart
  removeFromCart(productId: string, variantId?: number): boolean {
    const currentCart = this.getCartItems();
    const filtered = currentCart.filter(item => !(item.productId === productId && item.variantId === variantId));
    localStorage.setItem(CART_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new Event('cart-updated'));
    return true;
  },

  // Calculate total count of items in the cart
  getCartCount(): number {
    const items = this.getCartItems();
    return items.reduce((sum, item) => sum + item.quantity, 0);
  },

  // Clear cart
  clearCart() {
    localStorage.removeItem(CART_KEY);
    window.dispatchEvent(new Event('cart-updated'));
  },

  // 3. SECURE BUY NOW INTEGRATION
  initiateBuyNow(productId: string, quantity: number, variantId?: number): { success: boolean; message: string } {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) {
      return { success: false, message: 'Product not found' };
    }

    let availableStock = offerService.getInventoryStock(productId);
    let validatedPrice = 0;
    let variantName = '';

    // Automatically resolve default active variant if the product has variants but none was specified (Rule 24)
    if (!variantId) {
      const pVariants = productService.getProductVariants(productId);
      if (pVariants && pVariants.length > 0) {
        const defaultVar = pVariants.find(v => v.is_default && v.is_active) || pVariants.find(v => v.is_active);
        if (defaultVar) {
          variantId = defaultVar.id;
        }
      }
    }

    // Secure variant validation (Rule 10)
    if (variantId) {
      const variant = productService.getVariantById(variantId);
      if (!variant || variant.product_id !== productId || !variant.is_active) {
        return { success: false, message: 'Invalid or inactive variant.' };
      }
      availableStock = variant.stock_quantity;
      validatedPrice = variant.price;
      variantName = variant.name;
    } else {
      // Base product fallback
      const activeOffers = offerService.getActiveOffers();
      let appliedOfferId = 0;
      for (const offer of activeOffers) {
        const pids = offerService.getOfferProducts(offer.id).map(p => p.id);
        if (pids.includes(productId)) {
          appliedOfferId = offer.id;
          break;
        }
      }
      const priceDetails = offerService.getCalculatedProductPrice(productId, appliedOfferId);
      validatedPrice = priceDetails.price;
    }

    if (availableStock < quantity) {
      return { success: false, message: `Only ${availableStock} units available in stock.` };
    }

    // Save temporary buy-now state for checkout transition
    const buyNowData = {
      productId,
      variantId,
      variantName,
      quantity,
      price: validatedPrice,
      timestamp: new Date().toISOString()
    };

    localStorage.setItem(BUY_NOW_KEY, JSON.stringify(buyNowData));
    
    // Redirect to Checkout page trigger
    return { success: true, message: 'Preparing your order checkout...' };
  },

  // 4. PRIVATE CUSTOMER-SECURED WISHLIST
  // (Async versions implemented above)

  // Synchronize guest items into newly logged-in account
  syncGuestWishlistToUser(userId: number) {
    try {
      const guestKey = 'mysql_simulated_wishlist_guest';
      const guestItems: WishlistItem[] = JSON.parse(localStorage.getItem(guestKey) || '[]');
      if (guestItems.length === 0) return;

      const userKey = `mysql_simulated_wishlist_user_${userId}`;
      const userItems: WishlistItem[] = JSON.parse(localStorage.getItem(userKey) || '[]');

      // Merge and prevent duplicates
      const merged = [...userItems];
      for (const item of guestItems) {
        if (!merged.some(m => m.productId === item.productId)) {
          merged.push(item);
        }
      }

      localStorage.setItem(userKey, JSON.stringify(merged));
      localStorage.removeItem(guestKey); // clear guest entries after successful sync
      window.dispatchEvent(new Event('wishlist-updated'));
    } catch (e) {
      console.error('Failed to sync wishlist items:', e);
    }
  }
};
