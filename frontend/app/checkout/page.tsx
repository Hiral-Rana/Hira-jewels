"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useCartStore } from "@/lib/store";
import { toast } from "sonner";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import { CachedImage } from "@/components/ui/cached-image";

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const getTotal = useCartStore((state) => state.getTotal);
  const clearCart = useCartStore((state) => state.clearCart);

  
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });

  const subtotal = getTotal();
  const shipping = subtotal > 499 ? 0 : 50;
  const gst = subtotal * 0.18; // 18% GST
  const total = subtotal + shipping + gst;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!formData.fullName || !formData.email || !formData.phone || !formData.address) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      // Create order directly sending the items in request body (No need to sync cart to backend)
      const orderItems = items.map((item) => ({
        product: item.id,
        quantity: item.quantity,
        price: item.price,
      }));

      const orderResponse = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api/orders', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: formData.fullName,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          customerAddress: formData.address,
          notes: formData.notes || undefined,
          items: orderItems,
          subtotal: subtotal,
          shipping: shipping,
          tax: gst,
          total: total,
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok || !orderData.success) {
        throw new Error(orderData.error || "Failed to place order");
      }

      // Success!
      setOrderId(orderData.data._id || orderData.data.id);
      await clearCart();
      setIsSuccess(true);
      toast.success("Order placed successfully!");
    } catch (error: any) {
      console.error("Place order error:", error);
      toast.error(error.message || "Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
      <main className="flex-grow container mx-auto px-4 py-16 flex items-center justify-center">
          <Card className="max-w-md w-full text-center p-8 border border-border shadow-xl rounded-2xl bg-card">
            <div className="flex justify-center mb-6">
              <CheckCircle2 className="h-16 w-16 text-green-500 animate-bounce" />
            </div>
            <CardTitle className="text-3xl font-extrabold mb-2 tracking-tight text-primary">
              Order Confirmed!
            </CardTitle>
            <CardDescription className="text-muted-foreground mb-6">
              Thank you for your purchase. We are processing your order.
            </CardDescription>
            <div className="bg-muted/50 rounded-xl p-4 mb-8 text-left space-y-2 border border-muted">
              <p className="text-sm font-medium">
                <span className="text-muted-foreground">Order ID:</span>{" "}
                <span className="font-mono text-primary">{orderId}</span>
              </p>
              <p className="text-sm font-medium">
                <span className="text-muted-foreground">Deliver to:</span>{" "}
                <span className="text-primary">{formData.fullName}</span>
              </p>
              <p className="text-sm font-medium">
                <span className="text-muted-foreground">Total:</span>{" "}
                <span className="text-primary font-bold">₹{total.toFixed(2)}</span>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={() => router.push("/shop")} className="flex-1" size="lg">
                <ShoppingBag className="mr-2 h-5 w-5" />
                Continue Shopping
              </Button>
            </div>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-grow container mx-auto px-4 py-8 text-center flex flex-col items-center justify-center">
          <p className="text-xl mb-4 text-muted-foreground">Your cart is empty</p>
          <Button asChild size="lg">
            <a href="/shop">Continue Shopping</a>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <main className="flex-grow container mx-auto px-4 py-12 max-w-6xl">
        <h1 className="text-4xl font-extrabold mb-10 tracking-tight text-foreground">Checkout</h1>

        <form onSubmit={handlePlaceOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Billing Details Form */}
            <div className="lg:col-span-7 space-y-6">
              <Card className="border border-border shadow-sm rounded-xl bg-card">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Delivery Details</CardTitle>
                  <CardDescription>
                    Provide your contact and address information to place the order. No account required.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="e.g. John Doe"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="e.g. john@example.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Mobile Number *</Label>
                      <Input
                        type="tel"
                        id="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="e.g. +91 9876543210"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Delivery Address *</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Street address, apartment, city, state, pincode"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Order Note (Optional)</Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Any specific delivery instructions, landmarks, etc."
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Payment methods removed — single default handling on backend */}
            </div>

            {/* Order Summary & Confirm */}
            <div className="lg:col-span-5">
              <Card className="sticky top-24 border border-border shadow-md rounded-xl bg-card">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Your Order</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-4 items-center justify-between">
                        <div className="flex gap-4 items-center">
                          <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0 border">
                            {item.image && typeof item.image === 'string' && (item.image.startsWith('http') || item.image.startsWith('/')) ? (
                              <CachedImage
                                src={item.image}
                                alt={item.name || "Product"}
                                className="absolute inset-0 h-full w-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
                                No Img
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-sm line-clamp-1">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Qty: {item.quantity} × ₹{item.price}
                            </p>
                          </div>
                        </div>
                        <p className="font-bold text-sm">₹{item.price * item.quantity}</p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="font-medium">
                        {shipping === 0 ? (
                          <span className="text-green-600 font-bold">FREE</span>
                        ) : (
                          `₹${shipping}`
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">GST (18%)</span>
                      <span className="font-medium">₹{gst.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between font-extrabold text-lg text-primary">
                      <span>Total</span>
                      <span>₹{total.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full text-base font-bold h-12"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? "Placing Order..." : "Place Order Now"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}
