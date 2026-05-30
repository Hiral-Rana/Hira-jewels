"use client";

import Link from "next/link";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Product, useCartStore, useWishlistStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { getOptimizedImageSrc } from "@/lib/images";
import { CachedImage } from "@/components/ui/cached-image";
import { useRouter } from "next/navigation";

interface ProductCardProps {
  product: Product;
  noShadow?: boolean;
}

export default function ProductCard({ product, noShadow = false }: ProductCardProps) {
  const router = useRouter();
  const addToCart = useCartStore((state) => state.addItem);
  const addToWishlist = useWishlistStore((state) => state.addItem);
  const removeFromWishlist = useWishlistStore((state) => state.removeItem);
  const productId = product.id || product._id || "";
  const isInWishlist = useWishlistStore((state) => state.isInWishlist(productId));
  const [wishlistClicked, setWishlistClicked] = useState(false);

  const handleWishlistClick = () => {
    if (isInWishlist) {
      removeFromWishlist(productId);
      toast.success(`${product.name} removed from wishlist!`);
    } else {
      addToWishlist(product);
      toast.success(`${product.name} added to wishlist!`);
    }
    setWishlistClicked(true);
    setTimeout(() => setWishlistClicked(false), 500);
  };

  const handleAddToCart = async () => {
    try {
      await addToCart(product);
      toast.success(`${product.name} added to cart!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to add to cart');
    }
  };

  const productTags = Array.isArray(product.tags)
    ? Array.from(new Set(product.tags.filter((tag): tag is string => Boolean(tag && tag.trim()))))
    : [];

  const getTagBadgeClassName = (tag: string) => {
    const normalizedTag = tag.toLowerCase();

    if (normalizedTag === "sale") {
      return "bg-red-600 text-white shadow-sm ring-1 ring-black/10";
    }

    if (normalizedTag === "new") {
      return "bg-emerald-600 text-white shadow-sm ring-1 ring-black/10";
    }

    if (normalizedTag === "popular") {
      return "bg-amber-500 text-black shadow-sm ring-1 ring-black/10";
    }

    return "bg-primary text-primary-foreground shadow-sm ring-1 ring-black/10";
  };

  const isAvailable = product.inStock !== false;
  const productHref = isAvailable ? `/products/${product._id || product.id}` : "/studio";

  const navigateToProduct = () => {
    router.push(productHref);
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          "group overflow-hidden rounded-2xl border border-border/40 transition-all duration-500 cursor-pointer [container-type:inline-size] bg-card hover:-translate-y-1",
          !noShadow && "shadow-sm hover:shadow-2xl"
        )}
        onClick={navigateToProduct}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            navigateToProduct();
          }
        }}
        role="link"
        tabIndex={0}
      >
        <div className="relative aspect-square overflow-hidden bg-muted">
          <Link href={productHref} className="block w-full h-full">
            {product.image && typeof product.image === 'string' && (product.image.startsWith('http') || product.image.startsWith('/')) ? (
              <CachedImage
                src={getOptimizedImageSrc(product.image, { width: 480, height: 480, quality: 55 })}
                alt={product.name || "Product"}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground transition-transform duration-500 group-hover:scale-110 bg-secondary/20">
                No Img
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          </Link>
          {productTags.length > 0 && (
            <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
              {productTags.map((tag) => (
                <motion.span
                  key={tag}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={cn(
                    "text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider w-fit",
                    getTagBadgeClassName(tag)
                  )}
                >
                  {tag}
                </motion.span>
              ))}
            </div>
          )}
          <motion.div
            className="absolute top-2 right-2 z-10"
            initial={{ opacity: 0, scale: 0.8 }}
            whileHover={{ opacity: 1, scale: 1 }}
            animate={wishlistClicked ? { scale: [1, 1.3, 1] } : {}}
          >
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-background/70 backdrop-blur-md hover:bg-background shadow-sm border border-border/20"
              onClick={(e) => {
                e.stopPropagation();
                handleWishlistClick();
              }}
            >
              <Heart
                className={cn(
                  "h-4 w-4 transition-all",
                  isInWishlist && "fill-primary text-primary"
                )}
              />
            </Button>
          </motion.div>
          <motion.div
            className="absolute bottom-2 left-2 right-2 z-10"
            initial={{ opacity: 0, y: 10 }}
            whileHover={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              className="w-full h-[clamp(2rem,10cqi,2.75rem)] text-[clamp(0.7rem,4cqi,1rem)] rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl border border-white/10 transition-transform active:scale-95"
              onClick={(e) => {
                e.stopPropagation();
                if (isAvailable) {
                  handleAddToCart();
                } else {
                  router.push("/studio");
                }
              }}
            >
              {isAvailable ? (
                <>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </>
              ) : (
                <>
                  <Star className="h-4 w-4 mr-2" />
                  Custom Design
                </>
              )}
            </Button>
          </motion.div>
        </div>
        <div className="bg-muted/80 border-t border-border/40">
          <CardContent className="p-[clamp(0.75rem,4cqi,1.5rem)]">
          <Link href={productHref}>
            <h3 className="font-bold text-[clamp(1.125rem,8cqi,1.75rem)] tracking-tight leading-tight mb-[clamp(0.25rem,2cqi,0.5rem)] hover:text-primary transition-colors line-clamp-2">
              {product.name}
            </h3>
          </Link>
          {product.rating && (
            <div className="flex items-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-3 w-3",
                    i < Math.floor(product.rating!) ? "fill-primary text-primary" : "text-muted"
                  )}
                />
              ))}
              <span className="text-xs text-muted-foreground ml-1">
                ({product.rating})
              </span>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-[clamp(0.75rem,4cqi,1.5rem)] pt-0 flex justify-between items-end gap-2 flex-wrap">
          <div className="flex flex-col gap-0.5">
            {product.originalPrice && (
              <span className="text-[clamp(0.75rem,4cqi,1rem)] text-muted-foreground line-through decoration-destructive/50">
                ₹{product.originalPrice}
              </span>
            )}
            <span className="text-[clamp(1.125rem,7cqi,1.875rem)] font-extrabold text-foreground tracking-tight">₹{product.price}</span>
          </div>
          <span className={cn("text-[clamp(0.45rem,3cqi,0.7rem)] font-bold px-[clamp(0.35rem,2cqi,0.6rem)] py-[clamp(0.125rem,1cqi,0.2rem)] rounded-full whitespace-nowrap uppercase tracking-wider ring-1", isAvailable ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20" : "bg-destructive/10 text-destructive ring-destructive/20")}>
            {isAvailable ? "IN STOCK" : "NOT AVAILABLE"}
          </span>
        </CardFooter>
        </div>
      </Card>
    </motion.div>
  );
}
