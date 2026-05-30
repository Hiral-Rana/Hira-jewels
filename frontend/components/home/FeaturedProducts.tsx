"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import ProductCard from "./ProductCard";
import { Product } from "@/lib/store";
import Loading from "@/app/loading";
import { dedupedFetch } from "@/lib/fetch";
import { apiUrl } from "@/lib/api";

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Prevent duplicate calls in React Strict Mode
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchProducts = async () => {
      try {
        const data = await dedupedFetch<{ success: boolean; data: Product[] }>(apiUrl('/api/products'));
        if (data.success && data.data) {
          // Filter by tags: popular or sale
          const filtered = data.data.filter(p => 
            p.tags && (p.tags.includes('popular') || p.tags.includes('sale'))
          );
          setProducts(filtered);
        }
      } catch (error) {
        console.error('Failed to fetch featured products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Products</h2>
          <div className="w-20 h-1 bg-primary mx-auto" />
        </motion.div>

        {loading ? (
          <Loading />
        ) : products.length === 0 ? (
          <p className="text-center text-muted-foreground">No featured products found.</p>
        ) : (
          <div className="flex overflow-x-auto gap-4 lg:gap-6 pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full">
            {products.map((product, index) => (
              <motion.div
                key={product._id || product.id || index}
                className="w-[180px] sm:w-[200px] lg:w-[220px] shrink-0 snap-start"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: Math.min(index, 10) * 0.1 }}
              >
                <ProductCard product={product} noShadow />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
