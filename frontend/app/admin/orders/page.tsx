"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, Check, X, ClipboardList, Info, IndianRupee, Trash2 } from "lucide-react";
import Image from "next/image";
import DeletionConfirmDialog from "@/components/admin/DeletionConfirmDialog";

interface Product {
  _id: string;
  name: string;
  price: number;
  image: string;
}

interface OrderItem {
  _id: string;
  product: Product | null;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  status: "PENDING" | "WORKING" | "COMPLETED";
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  notes?: string;
  items: OrderItem[];
  createdAt: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Details Modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api/orders', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.data || []);
      }
    } catch (error) {
      console.error("Orders fetch error:", error);
      toast.error("Failed to load orders list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: "PENDING" | "WORKING" | "COMPLETED") => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/orders/${orderId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(`Order status updated to ${newStatus}`);
        
        // Update local state
        setOrders((prevOrders) =>
          prevOrders.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
        );
        
        // Update details modal if currently open
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      } else {
        toast.error(data.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Status change error:", error);
      toast.error("An error occurred while changing status.");
    }
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/orders/${orderToDelete._id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
          },
        }
      );
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success('Order deleted successfully');
        setOrders((prev) => prev.filter((order) => order._id !== orderToDelete._id));
        if (selectedOrder?._id === orderToDelete._id) {
          setSelectedOrder(null);
          setIsDetailsOpen(false);
        }
      } else {
        toast.error(data.error || 'Failed to delete order');
      }
    } catch (error) {
      console.error('Delete order error:', error);
      toast.error('An error occurred while deleting the order.');
    } finally {
      setIsDeleteOpen(false);
      setOrderToDelete(null);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Orders</h1>
        <p className="text-muted-foreground mt-1">Review and process customer purchase requests.</p>
      </div>

      <Card className="border border-border shadow-sm rounded-2xl bg-card overflow-hidden">
        <CardHeader className="p-6 border-b border-border bg-muted/20">
          <CardTitle className="text-xl font-bold">Purchase Requests</CardTitle>
          <CardDescription>Overview of customer orders.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground font-medium text-sm">Loading orders details...</p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Customer Name</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Total</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{order._id}</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground">{order.customerName}</div>
                        <div className="text-xs text-muted-foreground">{order.customerPhone}</div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-foreground">₹{order.total.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order._id, e.target.value as any)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold border outline-none bg-background cursor-pointer focus:ring-1 focus:ring-primary ${
                            order.status === "COMPLETED"
                              ? "text-green-600 border-green-500/20 bg-green-500/5"
                              : order.status === "WORKING"
                              ? "text-orange-500 border-orange-500/20 bg-orange-500/5"
                              : "text-yellow-600 border-yellow-500/20 bg-yellow-500/5"
                          }`}
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="WORKING">WORKING</option>
                          <option value="COMPLETED">COMPLETED</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsDetailsOpen(true);
                            }}
                            className="h-9 px-4 font-semibold text-xs border-border flex items-center gap-1.5"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Show Details
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setOrderToDelete(order);
                              setIsDeleteOpen(true);
                            }}
                            className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground font-medium">
                        No orders recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      {isDetailsOpen && selectedOrder && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full border border-border shadow-2xl rounded-2xl bg-card overflow-hidden">
            <CardHeader className="p-6 border-b border-border bg-muted/10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold">Order Details</CardTitle>
                  <CardDescription className="font-mono text-xs mt-1">ID: {selectedOrder._id}</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsDetailsOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Customer and Order metadata details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/30 rounded-xl p-4 border border-border/50 text-sm">
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground uppercase tracking-wider text-xs text-muted-foreground mb-1">Customer Info</h3>
                  <p><span className="text-muted-foreground">Name:</span> <strong className="text-foreground">{selectedOrder.customerName}</strong></p>
                  <p><span className="text-muted-foreground">Email:</span> <span className="text-foreground">{selectedOrder.customerEmail}</span></p>
                  <p><span className="text-muted-foreground">Phone:</span> <span className="text-foreground">{selectedOrder.customerPhone}</span></p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground uppercase tracking-wider text-xs text-muted-foreground mb-1">Delivery Address</h3>
                  <p className="text-foreground leading-relaxed font-medium">{selectedOrder.customerAddress}</p>
                  {selectedOrder.notes && (
                    <p className="mt-2 text-xs italic bg-background p-2 rounded border border-border/40 text-muted-foreground">
                      Note: "{selectedOrder.notes}"
                    </p>
                  )}
                </div>
              </div>

              {/* Order Status & Payment details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm bg-muted/10 p-4 rounded-xl border border-border/30">
                <div>
                  <span className="text-xs text-muted-foreground uppercase block font-semibold">Payment Status</span>
                  <span className="font-bold text-foreground capitalize">{selectedOrder.paymentStatus.toLowerCase()}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground uppercase block font-semibold">Payment Method</span>
                  <span className="font-bold text-foreground uppercase">{selectedOrder.paymentMethod}</span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-xs text-muted-foreground uppercase block font-semibold">Order Status</span>
                  <div className="flex items-center gap-2 mt-1">
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => handleStatusChange(selectedOrder._id, e.target.value as any)}
                      className={`px-2 py-0.5 rounded text-xs font-bold border outline-none bg-background cursor-pointer ${
                        selectedOrder.status === "COMPLETED"
                          ? "text-green-600 border-green-500/20"
                          : selectedOrder.status === "WORKING"
                          ? "text-orange-500 border-orange-500/20"
                          : "text-yellow-600 border-yellow-500/20"
                      }`}
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="WORKING">WORKING</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Order Items Table (Showcase products in table format) */}
              <div className="space-y-3">
                <h3 className="font-bold text-base text-foreground">Items In Purchase Request</h3>
                <div className="border border-border rounded-xl overflow-hidden overflow-x-auto w-full">
                  <table className="w-full text-sm text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold text-xs uppercase">
                        <th className="px-4 py-3 w-16">Preview</th>
                        <th className="px-4 py-3">Product Name</th>
                        <th className="px-4 py-3 text-right">Price</th>
                        <th className="px-4 py-3 text-center">Qty</th>
                        <th className="px-4 py-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {selectedOrder.items.map((item) => (
                        <tr key={item._id} className="hover:bg-muted/15">
                          <td className="px-4 py-2">
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden border bg-muted">
                              {item.product?.image && typeof item.product.image === 'string' && (item.product.image.startsWith('http') || item.product.image.startsWith('/')) ? (
                                <Image
                                  src={item.product.image}
                                  alt={item.product.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-[10px]">
                                  Deleted
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-semibold text-foreground">
                            {item.product?.name || "Deleted Product"}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-muted-foreground">₹{item.price.toLocaleString("en-IN")}</td>
                          <td className="px-4 py-3 text-center font-bold text-foreground">{item.quantity}</td>
                          <td className="px-4 py-3 text-right font-bold text-foreground">₹{(item.price * item.quantity).toLocaleString("en-IN")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Price calculations details */}
              <div className="border-t border-border pt-4 flex flex-col items-end gap-1.5 text-sm">
                <div className="flex justify-between w-64">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-semibold text-foreground">₹{selectedOrder.subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between w-64">
                  <span className="text-muted-foreground">Shipping Charge:</span>
                  <span className="font-semibold text-foreground">
                    {selectedOrder.shipping === 0 ? "FREE" : `₹${selectedOrder.shipping}`}
                  </span>
                </div>
                <div className="flex justify-between w-64">
                  <span className="text-muted-foreground">GST (18%):</span>
                  <span className="font-semibold text-foreground">₹{selectedOrder.tax.toLocaleString("en-IN")}</span>
                </div>
                <div className="border-t border-border mt-1 pt-2 flex justify-between w-64 text-base font-extrabold text-primary">
                  <span>Grand Total:</span>
                  <span>₹{selectedOrder.total.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </CardContent>

            <div className="p-6 border-t border-border flex justify-end bg-muted/10">
              <Button onClick={() => setIsDetailsOpen(false)} className="font-bold px-6">
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      <DeletionConfirmDialog
        open={isDeleteOpen && !!orderToDelete}
        title="Delete Order"
        description="This will permanently remove the order from the database. Are you sure you want to delete"
        itemName={orderToDelete?.customerName || "this order"}
        confirmLabel="Yes, Delete Order"
        onCancel={() => {
          setIsDeleteOpen(false);
          setOrderToDelete(null);
        }}
        onConfirm={handleDeleteOrder}
      />
    </div>
  );
}
