"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, ShoppingCart, Star, Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCartStore, useWishlistStore, Product } from "../../../lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ProductCard from "@/components/home/ProductCard";
import Link from "next/link";
import { dedupedFetch } from "@/lib/fetch";
import { ImageZoom } from "@/components/ui/image-zoom";
import { buildProductGallery, getOptimizedImageSrc } from "@/lib/images";
import { CachedImage } from "@/components/ui/cached-image";
import { getProductCategoryLabel } from "@/lib/productCategories";
import type { CartStore, WishlistStore } from "../../../lib/store";
import Loading from "@/app/loading";

export default function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const addToCart = useCartStore((state: CartStore) => state.addItem);
  const addToWishlist = useWishlistStore((state: WishlistStore) => state.addItem);
  const removeFromWishlist = useWishlistStore((state: WishlistStore) => state.removeItem);
  const productId = product?.id || product?._id || "";
  // Must call hook unconditionally - use empty string as default if product not loaded yet
  const isInWishlist = useWishlistStore((state: WishlistStore) =>
    state.isInWishlist(productId)
  );
  const hasFetched = useRef<string | null>(null);
  const currentProductIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Immediately reset states when params change (synchronous)
    // This prevents 404 flash by ensuring loading state is set before async operations
    setLoading(true);
    setNotFound(false);

    const fetchProduct = async () => {
      try {
        const { id: productId } = await params;

        // If navigating to a different product, clear old data
        if (
          currentProductIdRef.current !== null &&
          currentProductIdRef.current !== productId
        ) {
          setProduct(null);
          setRelatedProducts([]);
          hasFetched.current = null;
          setLoading(true); // Ensure loading state when switching products
        }

        // Validate productId
        if (!productId) {
          setNotFound(true);
          setLoading(false);
          currentProductIdRef.current = productId || null;
          return;
        }

        // Track current product and proceed with fetch
        // dedupedFetch will handle request deduplication at the network level
        if (hasFetched.current !== productId) {
          hasFetched.current = productId;
        }
        currentProductIdRef.current = productId;

        const productData = await dedupedFetch<{ success: boolean; data: any }>(
          (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + `/api/products/${encodeURIComponent(productId)}`
        );

        if (productData.success && productData.data) {
          setProduct(productData.data);

          // Fetch related products from same category
          const category = productData.data.category || "wedding";
          const relatedData = await dedupedFetch<{
            success: boolean;
            data: Product[];
          }>((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + `/api/products?category=${encodeURIComponent(category)}&limit=5`);

          if (relatedData.success) {
            const filtered = relatedData.data.filter(
              (p: Product) => p.id !== productId
            );
            setRelatedProducts(filtered.slice(0, 4));
          }
        } else {
          setNotFound(true);
        }
      } catch (error) {
        console.error("Failed to fetch product:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params]);

  // Show loading state while fetching
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Loading />
        </main>
        <Footer />
      </div>
    );
  }

  // Show 404 only after loading completes and product doesn't exist
  if (!loading && (notFound || !product)) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-16 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-6xl font-bold mb-4">404</h1>
            <h2 className="text-2xl font-semibold mb-4">Product Not Found</h2>
            <p className="text-muted-foreground mb-8">
              The product you're looking for doesn't exist.
            </p>
            <Button onClick={() => router.push("/shop")}>Back to Shop</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // TypeScript guard: product should exist at this point
  if (!product) {
    return null; // Should never reach here, but TypeScript needs this
  }

  const images = buildProductGallery(product.image, product.images || []);

  const productTags = Array.isArray(product.tags)
    ? Array.from(new Set(product.tags.filter((tag: string): tag is string => Boolean(tag && tag.trim()))))
    : [];

  const getTagBadgeClassName = (tag: string) => {
    const normalizedTag = tag.toLowerCase();

    if (normalizedTag === "sale") {
      return "bg-destructive text-destructive-foreground";
    }

    if (normalizedTag === "new") {
      return "bg-emerald-600 text-white";
    }

    if (normalizedTag === "popular") {
      return "bg-amber-500 text-black";
    }

    return "bg-primary text-primary-foreground";
  };

  const handleAddToCart = async () => {
    try {
      await addToCart(product, quantity);
      toast.success(`${product.name} added to cart!`);
    } catch (error: any) {
      toast.error(error.message || "Failed to add to cart");
    }
  };

  const handleAddToWishlist = () => {
    if (isInWishlist) {
      removeFromWishlist(productId);
      toast.success(`${product.name} removed from wishlist!`);
    } else {
      addToWishlist(product);
      toast.success(`${product.name} added to wishlist!`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow px-4 py-8">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 mb-12 lg:grid-cols-[minmax(420px,560px)_minmax(0,1fr)] lg:items-start">
          {/* Image Gallery */}
          <div className="relative z-0 w-full max-w-[560px] mx-auto lg:mx-0">
            <div 
              className="mb-4 cursor-zoom-in overflow-hidden rounded-xl border border-border transition-all"
              onClick={() => setIsFullscreen(true)}
            >
              <CachedImage
                src={getOptimizedImageSrc(images[selectedImage] || product.image, { width: 800, quality: 75 })}
                alt={product.name}
                className="w-full h-auto aspect-square object-cover"
                sizes="(max-width: 1024px) 100vw, 560px"
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={cn(
                    "aspect-square relative rounded-lg overflow-hidden border-2 transition-all bg-muted",
                    selectedImage === index
                      ? "border-primary"
                      : "border-transparent hover:border-muted"
                  )}
                >
                  {img ? (
                    <CachedImage
                      src={getOptimizedImageSrc(img, { width: 180, height: 180, quality: 45 })}
                      alt={`${product.name} ${index + 1}`}
                      className="absolute inset-0 h-full w-full object-cover"
                      sizes="(max-width: 1024px) 25vw, 12.5vw"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                      No Img
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="w-full mx-auto lg:mx-0 lg:pt-2">
            <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
            <p className="-mt-2 mb-4 text-sm text-muted-foreground capitalize">
              {getProductCategoryLabel(product.category)}
            </p>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-4 w-4",
                      i < Math.floor(product.rating || 0)
                        ? "fill-primary text-primary"
                        : "text-muted"
                    )}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                ({(product as any).reviewCount || 0} reviews)
              </span>
            </div>

            <div className="flex items-baseline gap-4 mb-6">
              <span className="text-3xl font-bold">₹{product.price}</span>
              {product.originalPrice && (
                <span className="text-xl text-muted-foreground line-through">
                  ₹{product.originalPrice}
                </span>
              )}
              {productTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {productTags.map((tag) => (
                    <span
                      key={tag}
                      className={cn(
                        "text-xs font-bold px-2 py-1 rounded uppercase tracking-wide",
                        getTagBadgeClassName(tag)
                      )}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mb-6">
              {product.inStock ? (
                <>
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="text-green-600 font-medium">In Stock</span>
                </>
              ) : (
                <>
                  <span className="h-5 w-5 text-red-600">✕</span>
                  <span className="text-red-600 font-medium">Out of Stock</span>
                </>
              )}
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-4">
                <label className="font-medium">Quantity:</label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    min="1"
                    max={
                      (product as any).stockQuantity > 0
                        ? (product as any).stockQuantity
                        : 999
                    }
                    value={quantity}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      const maxQty =
                        (product as any).stockQuantity > 0
                          ? (product as any).stockQuantity
                          : 999;
                      setQuantity(Math.max(1, Math.min(value, maxQty)));
                    }}
                    className="w-20 text-center"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const maxQty =
                        (product as any).stockQuantity > 0
                          ? (product as any).stockQuantity
                          : 999;
                      setQuantity(Math.min(maxQty, quantity + 1));
                    }}
                  >
                    +
                  </Button>
                </div>
                {(product as any).stockQuantity > 0 && (
                  <span className="text-sm text-muted-foreground">
                    (Max: {(product as any).stockQuantity})
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-4 mb-6">
              <Button
                size="lg"
                className="flex"
                onClick={handleAddToCart}
                disabled={!product.inStock}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to Cart
              </Button>
              <Button size="lg" variant="outline" onClick={handleAddToWishlist}>
                <Heart
                  className={cn(
                    "h-5 w-5",
                    isInWishlist && "fill-primary text-primary"
                  )}
                />
              </Button>
            </div>

            <p className="text-muted-foreground">{product.description}</p>

            <Tabs defaultValue="details" className="mt-8">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="properties">Properties</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="mt-6">
                <Card>
                  <CardContent className="pt-6">
                    <p className="mb-4 text-muted-foreground leading-7 whitespace-pre-line">
                      {product.details ||
                        product.description ||
                        "This exquisite jewelry piece features fine craftsmanship and premium materials."}
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="properties" className="mt-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium">Material:</span> {product.properties?.material || "Gold/Silver"}
                      </div>
                      <div>
                        <span className="font-medium">Weight:</span> {product.properties?.weight || "Not specified"}
                      </div>
                      <div>
                        <span className="font-medium">Style:</span> {product.properties?.style || "Classic"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard
                  key={relatedProduct._id || relatedProduct.id || `${relatedProduct.name}-${relatedProduct.price}`}
                  product={relatedProduct}
                />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />

      {isFullscreen && (
        <div className="fixed inset-0 z-[110] bg-black/95 flex flex-col animate-in fade-in duration-200">
          <div className="absolute top-6 right-6 z-50">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white transition-colors border-0"
              onClick={() => setIsFullscreen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          <div className="flex-1 relative flex items-center justify-center p-4">
            <CachedImage
              src={getOptimizedImageSrc(images[selectedImage] || product.image, { width: 1200, quality: 90 })}
              alt={product.name}
              className="max-w-full max-h-full object-contain"
              sizes="100vw"
            />
          </div>
          
          <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-end justify-center pb-8 gap-4 px-4">
            {images.slice(0, 3).map((img, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={cn(
                  "relative h-20 w-20 md:h-24 md:w-24 rounded-xl overflow-hidden border-2 transition-all bg-muted/20",
                  selectedImage === index
                    ? "border-primary scale-110 shadow-lg shadow-black/50 z-10"
                    : "border-white/20 opacity-60 hover:opacity-100 hover:scale-105"
                )}
              >
                {img ? (
                  <CachedImage
                    src={getOptimizedImageSrc(img, { width: 150, height: 150, quality: 50 })}
                    alt={`${product.name} ${index + 1}`}
                    className="absolute inset-0 h-full w-full object-cover"
                    sizes="100px"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-white/50">
                    No Img
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
