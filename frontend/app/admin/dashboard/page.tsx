"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Loading from "@/app/loading";
import { ShoppingBag, ClipboardList, Clock, CheckCircle, Flame, IndianRupee } from "lucide-react";
import { getProductCategoryLabel, normalizeProductCategoryValue } from "@/lib/productCategories";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface Order {
  _id: string;
  status: string;
  total: number;
  customerName: string;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch products
        const prodRes = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api/products');
        const prodData = await prodRes.json();
        
        // Fetch orders
        const ordRes = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api/orders', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
          }
        });
        const ordData = await ordRes.json();

        if (prodData.success) setProducts(prodData.data || []);
        if (ordData.success) setOrders(ordData.data || []);
      } catch (error) {
        console.error("Dashboard fetch error:", error);
        toast.error("Failed to load dashboard statistics.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const normalizedProducts = products.map((product) => ({
    ...product,
    category: normalizeProductCategoryValue(product.category),
  }));

  const totalProducts = normalizedProducts.length;
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === "PENDING").length;
  const workingOrders = orders.filter((o) => o.status === "WORKING").length;
  const completedOrders = orders.filter((o) => o.status === "COMPLETED").length;
  
  // Total sales revenue from completed orders
  const totalRevenue = orders
    .filter((o) => o.status === "COMPLETED")
    .reduce((sum, o) => sum + o.total, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <Loading />
      </div>
    );
  }

  const stats = [
    {
      title: "Total Revenue",
      value: `₹${totalRevenue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
      description: "From completed orders",
      icon: IndianRupee,
      color: "text-green-500 bg-green-500/10 border-green-500/20",
    },
    {
      title: "Active Catalog",
      value: totalProducts.toString(),
      description: "Total live products",
      icon: ShoppingBag,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "Total Orders",
      value: totalOrders.toString(),
      description: "Total checkouts recorded",
      icon: ClipboardList,
      color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    },
    {
      title: "Pending Orders",
      value: pendingOrders.toString(),
      description: "Awaiting review",
      icon: Clock,
      color: "text-yellow-600 bg-yellow-500/10 border-yellow-500/20",
    },
    {
      title: "In Progress (Working)",
      value: workingOrders.toString(),
      description: "Currently working",
      icon: Flame,
      color: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    },
    {
      title: "Completed Orders",
      value: completedOrders.toString(),
      description: "Delivered & done",
      icon: CheckCircle,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Real-time summaries of your jewellery store operations.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border border-border shadow-sm rounded-2xl bg-card transition-all duration-200 hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{stat.title}</span>
                <div className={`p-2.5 rounded-xl border ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-foreground tracking-tight">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1.5">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
        {/* Recent Orders */}
        <Card className="border border-border shadow-sm rounded-2xl bg-card overflow-hidden">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="text-xl font-bold">Recent Orders</CardTitle>
            <CardDescription>Latest purchase requests received.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-y border-border bg-muted/40 text-muted-foreground font-semibold">
                    <th className="px-6 py-3.5">Customer</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.slice(0, 5).map((order) => (
                    <tr key={order._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-semibold text-foreground">{order.customerName}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            order.status === "COMPLETED"
                              ? "bg-green-500/10 text-green-600 border border-green-500/20"
                              : order.status === "WORKING"
                              ? "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                              : "bg-yellow-500/10 text-yellow-600 border border-yellow-500/20"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-foreground">₹{order.total.toFixed(2)}</td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground font-medium">
                        No orders recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Catalog Breakdown */}
        <Card className="border border-border shadow-sm rounded-2xl bg-card overflow-hidden">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="text-xl font-bold">Catalog Breakdown</CardTitle>
            <CardDescription>Product distribution across categories.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-y border-border bg-muted/40 text-muted-foreground font-semibold">
                    <th className="px-6 py-3.5">Category</th>
                    <th className="px-6 py-3.5 text-right">Product Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {Array.from(new Set(normalizedProducts.map((p) => p.category))).map((cat) => (
                    <tr key={cat} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-semibold text-foreground">{getProductCategoryLabel(cat)}</td>
                      <td className="px-6 py-4 text-right font-bold text-foreground">
                        {normalizedProducts.filter((p) => p.category === cat).length}
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-6 py-12 text-center text-muted-foreground font-medium">
                        No products inside catalog yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
