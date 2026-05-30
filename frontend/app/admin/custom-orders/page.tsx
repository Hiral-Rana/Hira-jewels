"use client";

import { useEffect, useState, Fragment } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, Clock, Search, ChevronRight, FileText, X, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import DeletionConfirmDialog from "@/components/admin/DeletionConfirmDialog";
import { cn } from "@/lib/utils";

interface CustomOrder {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  designCategory: string;
  note: string;
  status: string;
  createdAt: string;
}

export default function AdminCustomOrdersPage() {
  const [orders, setOrders] = useState<CustomOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<CustomOrder | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<CustomOrder | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api/custom-orders', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setOrders(data.data);
      } else {
        toast.error("Failed to load custom orders");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error loading custom orders");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + `/api/custom-orders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success("Status updated");
        setOrders(orders.map(o => o._id === id ? { ...o, status: newStatus } : o));
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error updating status");
    }
  };

  const handleDeleteCustomOrder = async () => {
    if (!orderToDelete) return;

    try {
      const response = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + `/api/custom-orders/${orderToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success('Custom order deleted');
        setOrders((prev) => prev.filter((order) => order._id !== orderToDelete._id));
        if (selectedOrder?._id === orderToDelete._id) {
          setSelectedOrder(null);
        }
      } else {
        toast.error(data.error || 'Failed to delete custom order');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error deleting custom order');
    } finally {
      setIsDeleteOpen(false);
      setOrderToDelete(null);
    }
  };

  const filteredOrders = orders.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.email.toLowerCase().includes(search.toLowerCase()) ||
    o.mobile.includes(search)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'Reviewed': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'In Progress': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
      case 'Completed': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="pt-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Custom Orders</h1>
          <p className="text-muted-foreground mt-1">Manage custom design requests from users</p>
        </div>
      </div>

      <Card className="border border-border shadow-sm rounded-2xl bg-card overflow-hidden">
        <CardHeader className="p-6 border-b border-border bg-muted/20">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-xl font-bold">Custom Design Requests</CardTitle>
              <CardDescription className="mt-1">View and respond to client custom jewelry requests.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground font-medium text-sm">Loading custom orders...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="overflow-x-auto w-full border border-border rounded-xl overflow-hidden">
                <table className="w-full min-w-[920px] border-collapse text-sm text-left">
                  <thead>
                    <tr className="bg-muted/60 text-foreground font-semibold border-y border-border">
                      <th className="px-6 py-4 whitespace-nowrap">Full Name</th>
                      <th className="px-6 py-4 whitespace-nowrap">Email Address</th>
                      <th className="px-6 py-4 whitespace-nowrap">Mobile Number</th>
                      <th className="px-6 py-4 whitespace-nowrap">Current Status</th>
                      <th className="px-6 py-4 whitespace-nowrap text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {filteredOrders.length > 0 ? (
                      filteredOrders.map((order) => (
                        <Fragment key={order._id}>
                          <tr
                            onClick={() => setSelectedOrder(selectedOrder?._id === order._id ? null : order)}
                            className={`cursor-pointer align-top transition-colors hover:bg-muted/20 ${selectedOrder?._id === order._id ? "bg-muted/30" : ""}`}
                          >
                            <td className="px-6 py-4 font-semibold text-foreground whitespace-nowrap">{order.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <a href={`mailto:${order.email}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary hover:underline">
                                <Mail className="h-4 w-4" />
                                <span>{order.email}</span>
                              </a>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <a href={`tel:${order.mobile}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary hover:underline">
                                <Phone className="h-4 w-4" />
                                <span>{order.mobile}</span>
                              </a>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col gap-2 min-w-[180px]" onClick={(e) => e.stopPropagation()}>
                                <Select value={order.status} onValueChange={(val) => handleStatusChange(order._id, val)}>
                                  <SelectTrigger className="h-9 w-full">
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Pending">Pending</SelectItem>
                                    <SelectItem value="Reviewed">Reviewed</SelectItem>
                                    <SelectItem value="In Progress">In Progress</SelectItem>
                                    <SelectItem value="Completed">Completed</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Badge variant="outline" className={getStatusColor(order.status)}>
                                  {order.status}
                                </Badge>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center whitespace-nowrap">
                              <div className="flex flex-col items-center gap-2 min-w-[200px]">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedOrder(selectedOrder?._id === order._id ? null : order);
                                  }}
                                  className="text-xs font-medium text-foreground hover:text-primary inline-flex items-center gap-1"
                                >
                                  <ChevronRight className={cn("h-4 w-4 transition-transform", selectedOrder?._id === order._id && "rotate-90")} /> View Details
                                </button>
                                <a
                                  href={`https://mail.google.com/mail/u/0/#search/to%3A${encodeURIComponent(order.email)}`}
                                  onClick={(e) => e.stopPropagation()}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs font-medium text-blue-600 hover:underline inline-flex items-center gap-1"
                                >
                                  <Mail className="h-4 w-4" /> Open Gmail Thread
                                </a>
                                <a
                                  href={`mailto:${order.email}?subject=Regarding Your Custom Jewelry Request (${order.designCategory})`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
                                >
                                  <Mail className="h-4 w-4" /> Compose Email
                                </a>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOrderToDelete(order);
                                    setIsDeleteOpen(true);
                                  }}
                                  className="text-xs font-medium text-destructive hover:underline inline-flex items-center gap-1"
                                >
                                  <Trash2 className="h-4 w-4" /> Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                          {selectedOrder?._id === order._id && (
                            <tr className="bg-muted/5 border-b border-border/60">
                              <td colSpan={5} className="px-6 py-8 cursor-default">
                                <div className="flex items-center justify-between gap-4 mb-6">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                      <FileText className="h-5 w-5" />
                                    </div>
                                    <div>
                                      <h2 className="text-lg font-bold text-foreground">Order Details</h2>
                                      <p className="text-sm text-muted-foreground">
                                        Design category, submission date, and notes for the selected order.
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setSelectedOrder(null); }}
                                    className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
                                  >
                                    <X className="h-4 w-4" /> Hide Details
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-1">
                                  <div className="space-y-4">
                                    <div>
                                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Full Name</p>
                                      <p className="text-base font-semibold text-foreground mt-1">{selectedOrder.name}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email Address</p>
                                      <a href={`mailto:${selectedOrder.email}`} className="text-base text-primary hover:underline mt-1 inline-block">
                                        {selectedOrder.email}
                                      </a>
                                    </div>
                                    <div>
                                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mobile Number</p>
                                      <a href={`tel:${selectedOrder.mobile}`} className="text-base text-primary hover:underline mt-1 inline-block">
                                        {selectedOrder.mobile}
                                      </a>
                                    </div>
                                  </div>

                                  <div className="space-y-4">
                                    <div>
                                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Design Category</p>
                                      <Badge variant="secondary" className="mt-2">{selectedOrder.designCategory}</Badge>
                                    </div>
                                    <div>
                                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Submission Date</p>
                                      <div className="inline-flex items-center gap-1 mt-2 text-foreground">
                                        <Clock className="h-4 w-4" />
                                        <span>{new Date(selectedOrder.createdAt).toLocaleDateString()}</span>
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current Status</p>
                                      <div className="mt-2">
                                        <Badge variant="outline" className={getStatusColor(selectedOrder.status)}>
                                          {selectedOrder.status}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="md:col-span-2">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Notes</p>
                                    <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
                                      <p className="whitespace-pre-wrap leading-6 text-foreground">{selectedOrder.note}</p>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground font-medium bg-card">
                          No custom orders found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>



              <DeletionConfirmDialog
                open={isDeleteOpen && !!orderToDelete}
                title="Delete Custom Order"
                description="This will permanently remove the custom order from the database. Are you sure you want to delete"
                itemName={orderToDelete?.name || "this custom order"}
                confirmLabel="Yes, Delete Custom Order"
                onCancel={() => {
                  setIsDeleteOpen(false);
                  setOrderToDelete(null);
                }}
                onConfirm={handleDeleteCustomOrder}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
