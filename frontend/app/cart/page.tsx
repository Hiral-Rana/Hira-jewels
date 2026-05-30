"use client";

import { useEffect, useState } from "react";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { AlertTriangle, Trash2, Plus, Minus, X } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { toast } from "sonner";
import { CachedImage } from "@/components/ui/cached-image";

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const isLoading = useCartStore((state) => state.isLoading);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const getTotal = useCartStore((state) => state.getTotal);

  const originalSubtotal = items.reduce(
    (sum, item) => sum + (item.originalPrice ?? item.price) * item.quantity,
    0
  );
  const discountedSubtotal = getTotal();
  const savings = Math.max(0, originalSubtotal - discountedSubtotal);
  const total = discountedSubtotal
    const [showWarning, setShowWarning] = useState(true);

    useEffect(() => {
      try {
        const dismissed = localStorage.getItem("hj_cart_warning_dismissed");
        if (dismissed) setShowWarning(false);
      } catch (e) {
        // ignore
      }
    }, []);

    const dismissWarning = () => {
      try {
        localStorage.setItem("hj_cart_warning_dismissed", "1");
      } catch (e) {
        // ignore
      }
      setShowWarning(false);
    };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

        {showWarning && (
          <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200 flex items-start gap-3 relative">
            <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <p>
              Your cart is stored only in this browser. Products will not be available after closing this site for long periods or clearing browser data.
            </p>
            <button
              aria-label="Dismiss cart warning"
              onClick={dismissWarning}
              className="absolute top-2 right-2 p-1 rounded hover:bg-amber-500/20"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground">Loading cart...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground mb-4">
              Your cart is empty
            </p>
            <Button asChild>
              <Link href="/shop">Continue Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item, index) => {
                const resolvedProductId = item.id || item._id || item.cartItemId || "";
                const rowKey = item.cartItemId || resolvedProductId || `${item.name}-${index}`;

                return (
                <Card key={rowKey}>
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted">
                        {item.image && typeof item.image === 'string' && (item.image.startsWith('http') || item.image.startsWith('/')) ? (
                          <CachedImage
                            src={item.image}
                            alt={item.name || "Product"}
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                            No Img
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <Link
                          href={`/products/${resolvedProductId}`}
                          className="font-semibold hover:text-primary"
                        >
                          {item.name}
                        </Link>
                        <div className="mb-2 flex items-center gap-2 text-sm">
                          {item.originalPrice ? (
                            <span className="text-muted-foreground line-through">
                              ₹{item.originalPrice}
                            </span>
                          ) : null}
                          <span className="font-medium text-primary">₹{item.price}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center border rounded-md">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={async () => {
                                try {
                                  if (!resolvedProductId) {
                                    toast.error('Unable to update this item. Please refresh cart.');
                                    return;
                                  }
                                  await updateQuantity(resolvedProductId, item.quantity - 1);
                                } catch (error: any) {
                                  toast.error(error.message || 'Failed to update quantity');
                                }
                              }}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="px-4">{item.quantity}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={async () => {
                                try {
                                  if (!resolvedProductId) {
                                    toast.error('Unable to update this item. Please refresh cart.');
                                    return;
                                  }
                                  await updateQuantity(resolvedProductId, item.quantity + 1);
                                } catch (error: any) {
                                  toast.error(error.message || 'Failed to update quantity');
                                }
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (!resolvedProductId) {
                                toast.error('Unable to remove this item. Please refresh cart.');
                                return;
                              }
                              removeItem(resolvedProductId);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-right">
                        {item.originalPrice ? (
                          <p className="text-sm text-muted-foreground line-through">
                            ₹{item.originalPrice * item.quantity}
                          </p>
                        ) : null}
                        <p className="font-bold">₹{item.price * item.quantity}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );})}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Original Total</span>
                    <span className="line-through text-muted-foreground">₹{originalSubtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discounted Total</span>
                    <span className="font-medium text-primary">₹{discountedSubtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Savings</span>
                    <span className="text-green-600">-₹{savings}</span>
                  </div>
                  <div className="border-t pt-4 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹{total}</span>
                  </div>
                  <Button className="w-full" size="lg" asChild>
                    <Link href="/checkout">Proceed to Checkout</Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/shop">Continue Shopping</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
