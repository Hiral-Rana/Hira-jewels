"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, ShieldAlert } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getProductCategoryLabel } from "@/lib/productCategories";
import { apiUrl } from "@/lib/api";

interface Product {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  inStock: boolean;
  stockQuantity: number;
}

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Warning/Delete states
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleteWarningOpen, setIsDeleteWarningOpen] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(apiUrl('/api/products'));
      const data = await res.json();
      if (data.success) {
        setProducts(data.data || []);
      }
    } catch (error) {
      console.error("Products fetch error:", error);
      toast.error("Failed to load products list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    try {
      const response = await fetch(
        apiUrl(`/api/products/${productToDelete._id || productToDelete.id}`),
        {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${localStorage.getItem('auth-token')}`
          }
        }
      );
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success("Product deleted successfully");
        setIsDeleteWarningOpen(false);
        setProductToDelete(null);
        fetchProducts();
      } else {
        toast.error(data.error || "Failed to delete product.");
      }
    } catch (error) {
      console.error("Delete product error:", error);
      toast.error("An error occurred while deleting the product.");
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Products</h1>
          <p className="text-muted-foreground mt-1">Manage and update your jewellery catalog.</p>
        </div>
        <Button asChild className="h-11 px-6 font-bold flex items-center gap-2 self-start sm:self-auto">
          <Link href="/admin/products/new">
            <Plus className="h-5 w-5" />
            Add New Product
          </Link>
        </Button>
      </div>

      <Card className="border border-border shadow-sm rounded-2xl bg-card overflow-hidden">
        <CardHeader className="p-6 border-b border-border bg-muted/20">
          <CardTitle className="text-xl font-bold">Catalog List</CardTitle>
          <CardDescription>Live database catalog overview.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground font-medium text-sm">Loading catalog details...</p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                    <th className="px-6 py-4 w-20">Preview</th>
                    <th className="px-6 py-4">Product Name</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Stock Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {products.map((product) => (
                    <tr key={product._id || product.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-3">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden border bg-muted">
                          {product.image && typeof product.image === 'string' && (product.image.startsWith('http') || product.image.startsWith('/')) ? (
                            <Image
                              src={product.image}
                              alt={product.name || "Product"}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground bg-muted">
                              No Img
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-foreground">{product.name || "Unnamed Product"}</td>
                      <td className="px-6 py-4 text-muted-foreground">{getProductCategoryLabel(product.category)}</td>
                      <td className="px-6 py-4 font-bold text-foreground">₹{(product.price || 0).toLocaleString("en-IN")}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            product.inStock
                              ? "bg-green-500/10 text-green-600 border border-green-500/20"
                              : "bg-red-500/10 text-red-600 border border-red-500/20"
                          }`}
                        >
                          {product.inStock ? "In Stock" : "Out of Stock"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <Link href={`/admin/products/edit/${product._id || product.id}`}>
                              <Edit2 className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setProductToDelete(product);
                              setIsDeleteWarningOpen(true);
                            }}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground font-medium">
                        No products inside catalog yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* WARNING DELETE MODAL */}
      {isDeleteWarningOpen && productToDelete && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full border border-destructive/20 shadow-2xl rounded-2xl bg-card overflow-hidden">
            <CardHeader className="p-6 border-b border-border bg-destructive/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-bold text-destructive">Confirm Deletion</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Are you absolutely sure you want to delete <span className="font-bold text-foreground">"{productToDelete.name}"</span>?
                This action is irreversible and will remove the item permanently from the storefront database.
              </p>
            </CardContent>
            <div className="p-6 border-t border-border flex justify-end gap-3 bg-muted/10">
              <Button variant="outline" onClick={() => {
                setIsDeleteWarningOpen(false);
                setProductToDelete(null);
              }}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete} className="font-bold">
                Yes, Delete Product
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
