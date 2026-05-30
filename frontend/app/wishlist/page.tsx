"use client";

import { useEffect, useState } from "react";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { AlertTriangle, Trash2, ShoppingCart, Heart, X } from "lucide-react";
import { useWishlistStore, useCartStore } from "@/lib/store";
import { toast } from "sonner";
import { CachedImage } from "@/components/ui/cached-image";

function WishlistWarning() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem("hj_wishlist_warning_dismissed");
      if (dismissed) setShow(false);
    } catch (e) {
      // ignore
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem("hj_wishlist_warning_dismissed", "1");
    } catch (e) {
      // ignore
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200 flex items-start gap-3 relative">
      <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
      <p>
        Your wishlist is stored only in this browser. It will not be available after closing this site for long periods or clearing browser data.
      </p>
      <button
        aria-label="Dismiss wishlist warning"
        onClick={dismiss}
        className="absolute top-2 right-2 p-1 rounded hover:bg-amber-500/20"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function WishlistPage() {
  const items = useWishlistStore((state) => state.items);
  const isLoading = useWishlistStore((state) => state.isLoading);
  const removeItem = useWishlistStore((state) => state.removeItem);
  const addToCart = useCartStore((state) => state.addItem);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Wishlist</h1>
        <WishlistWarning />

        {isLoading ? (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground">Loading wishlist...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-xl text-muted-foreground mb-4">
              Your wishlist is empty
            </p>
            <Button asChild>
              <Link href="/shop">Continue Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((item) => (
              <Card key={item.id} className="group">
                <div className="relative aspect-square overflow-hidden bg-muted rounded-t-lg">
                  <Link href={`/products/${item._id || item.id}`}>
                    {item.image && typeof item.image === 'string' && (item.image.startsWith('http') || item.image.startsWith('/')) ? (
                      <CachedImage
                        src={item.image}
                        alt={item.name || "Product"}
                        className="absolute inset-0 h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground group-hover:scale-110 transition-transform duration-300">
                        No Img
                      </div>
                    )}
                  </Link>
                  <div className="absolute top-2 right-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-background/90 backdrop-blur-sm"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4">
                  <Link href={`/products/${item._id || item.id}`}>
                    <h3 className="font-semibold mb-2 hover:text-primary transition-colors">
                      {item.name}
                    </h3>
                  </Link>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-lg font-bold">₹{item.price}</span>
                    {item.originalPrice && (
                      <span className="text-sm text-muted-foreground line-through">
                        ₹{item.originalPrice}
                      </span>
                    )}
                  </div>
                  <Button
                    className="w-full"
                    onClick={async () => {
                      try {
                        await addToCart(item);
                        removeItem(item.id);
                      } catch (error: any) {
                        toast.error(error.message || 'Failed to add to cart');
                      }
                    }}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
