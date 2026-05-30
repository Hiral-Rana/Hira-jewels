import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { toast } from 'sonner';
import { apiUrl } from './api';

export interface Product {
  _id?: string;
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  tags?: string[];
  description?: string;
  details?: string;
  properties?: {
    material?: string;
    weight?: string;
    style?: string;
    finish?: string;
  };
  category: string | string[];
  rating?: number;
  inStock?: boolean;
  stockQuantity?: number | null;
}

export interface CartItem extends Product {
  quantity: number;
  cartItemId?: string;
}

export interface CartStore {
  items: CartItem[];
  isLoading: boolean;
  addItem: (product: Product, quantity?: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  syncFromBackend: () => Promise<void>;
  getTotal: () => number;
  getItemCount: () => number;
}

export interface WishlistStore {
  items: Product[];
  isLoading: boolean;
  addItem: (product: Product) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  syncFromBackend: () => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  getItemCount: () => number;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
}

interface AuthStore {
  user: User | null;
  setUser: (user: User | null) => void;
  checkAuth: () => Promise<void>;
  logout: () => void;
}

const getCartIdentity = (item: Partial<CartItem> | Partial<Product>) => item.id || item._id || '';

const matchesCartIdentity = (item: CartItem, identifier: string) => {
  if (!identifier) {
    return false;
  }

  return item.id === identifier || item._id === identifier || item.cartItemId === identifier;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      syncFromBackend: async () => {
        set({ isLoading: false });
      },
      addItem: async (product, quantity = 1) => {
        const productId = getCartIdentity(product);
        if (!productId) {
          throw new Error('Product id is missing');
        }

        if (product.inStock === false) {
          throw new Error('Product is out of stock');
        }

        if (
          product.stockQuantity !== undefined &&
          product.stockQuantity !== null &&
          product.stockQuantity > 0
        ) {
          const existingItem = get().items.find((item) => matchesCartIdentity(item, productId));
          const currentQuantity = existingItem?.quantity || 0;
          const newTotalQuantity = currentQuantity + quantity;

          if (newTotalQuantity > product.stockQuantity) {
            throw new Error(
              `Only ${product.stockQuantity} items available. You already have ${currentQuantity} in cart.`
            );
          }
        }

        const items = get().items;
        const existingItem = items.find((item) => matchesCartIdentity(item, productId));

        if (existingItem) {
          set({
            items: items.map((item) =>
              matchesCartIdentity(item, productId) ? { ...item, quantity: item.quantity + quantity } : item
            ),
          });
        } else {
          set({ items: [...items, { ...product, id: productId, quantity }] });
        }
      },
      removeItem: async (productId) => {
        set({ items: get().items.filter((item) => !matchesCartIdentity(item, productId)) });
      },
      updateQuantity: async (productId, quantity) => {
        if (quantity <= 0) {
          await get().removeItem(productId);
          return;
        }

        const items = get().items;
        const existingItem = items.find((item) => matchesCartIdentity(item, productId));

        if (!existingItem) {
          throw new Error('Item not found in cart');
        }

        if (
          existingItem.stockQuantity !== undefined &&
          existingItem.stockQuantity !== null &&
          existingItem.stockQuantity > 0 &&
          quantity > existingItem.stockQuantity
        ) {
          throw new Error(`Only ${existingItem.stockQuantity} items available.`);
        }

        set({
          items: items.map((item) =>
            matchesCartIdentity(item, productId) ? { ...item, quantity } : item
          ),
        });
      },
      clearCart: async () => {
        set({ items: [] });
      },
      getTotal: () => get().items.reduce((total, item) => total + item.price * item.quantity, 0),
      getItemCount: () => get().items.reduce((count, item) => count + item.quantity, 0),
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      syncFromBackend: async () => {
        set({ isLoading: false });
      },
      addItem: async (product) => {
        const productId = product.id || product._id || '';
        if (!productId) {
          throw new Error('Product id is missing');
        }

        if (get().isInWishlist(productId)) {
          return;
        }

        set({ items: [...get().items, { ...product, id: productId }] });
      },
      removeItem: async (productId) => {
        set({ items: get().items.filter((item) => (item.id || item._id) !== productId) });
      },
      isInWishlist: (productId) => {
        return get().items.some((item) => (item.id || item._id) === productId);
      },
      getItemCount: () => get().items.length,
    }),
    {
      name: 'wishlist-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const useAuthStore = create<AuthStore>()((set) => {
  let checkingAuth = false;
  let authPromise: Promise<void> | null = null;

  return {
    user: null,
    setUser: (user) => set({ user }),
    checkAuth: async () => {
      if (checkingAuth && authPromise) {
        return authPromise;
      }

      checkingAuth = true;
      authPromise = (async () => {
        try {
          const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
          if (!token) {
            set({ user: null });
            return;
          }

          const headers: HeadersInit = {};
          headers['Authorization'] = `Bearer ${token}`;

          const response = await fetch(apiUrl('/api/auth/me'), {
            cache: 'no-store',
            headers,
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              set({ user: data.data });
            } else {
              set({ user: null });
            }
          } else {
            set({ user: null });
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          set({ user: null });
        } finally {
          checkingAuth = false;
          authPromise = null;
        }
      })();

      return authPromise;
    },
    logout: async () => {
      try {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-token');
          document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        }
        await fetch(apiUrl('/api/auth/logout'), { method: 'POST' });
      } catch (error) {
        console.error('Logout failed:', error);
      }
      set({ user: null });
    },
  };
});