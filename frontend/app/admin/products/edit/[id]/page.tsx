"use client";

import { useEffect, useState } from "react";
import ProductForm from "../../ProductForm";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function EditProductPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  const router = useRouter();
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const resolvedParams = await Promise.resolve(params);
        const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + `/api/products/${resolvedParams.id}`);
        const data = await res.json();
        if (data.success) {
          setInitialData(data.data);
        } else {
          toast.error("Failed to load product details.");
          router.push("/admin/products");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        toast.error("Error loading product.");
        router.push("/admin/products");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground font-medium text-sm">Loading product details...</p>
      </div>
    );
  }

  if (!initialData) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="py-6">
      <ProductForm initialData={initialData} isEditing={true} />
    </div>
  );
}
