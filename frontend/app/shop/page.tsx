"use client";

import { useState, useEffect } from "react";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Loading from "@/app/loading";
import ProductCard from "@/components/home/ProductCard";
import { Product } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Grid, List, SlidersHorizontal, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import {
  PRODUCT_CATEGORY_GROUPS,
  getExpandedCategorySelection,
  getProductCategoryLabel,
  matchesProductCategory,
  normalizeProductCategoryValue,
} from "@/lib/productCategories";
import { apiUrl } from "@/lib/api";

export default function ShopPage() {
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>("position");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch(apiUrl('/api/products'));
        const data = await response.json();
        if (data.success && data.data) {
          setProducts(data.data);
          // Set max price range based on actual products
          if (data.data.length > 0) {
            const catalogMaxPrice = Math.max(...data.data.map((p: Product) => p.price));
            const nextMaxPrice = Math.max(10000, catalogMaxPrice);
            setMaxPrice(nextMaxPrice);
            setPriceRange([0, nextMaxPrice]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const category = searchParams.get("category") || "";
    const subcategory = searchParams.get("subcategory") || "";

    if (category) {
      setSelectedCategories(getExpandedCategorySelection(category, subcategory || undefined));
    } else {
      setSelectedCategories([]);
    }
  }, [searchParams]);

  // Filter products
  let filteredProducts = products.filter((product) => {
    const inPriceRange =
      product.price >= priceRange[0] && product.price <= priceRange[1];
    const inCategory = matchesProductCategory(product.category, selectedCategories);
    return inPriceRange && inCategory;
  });

  // Sort products
  filteredProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return 0; // position - keep original order
    }
  });

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(normalizeProductCategoryValue(category))
        ? prev.filter((c) => normalizeProductCategoryValue(c) !== normalizeProductCategoryValue(category))
        : [...prev, normalizeProductCategoryValue(category)]
    );
  };

  const toggleGroup = (groupValue: string) => {
    const normalizedGroup = normalizeProductCategoryValue(groupValue);
    const group = PRODUCT_CATEGORY_GROUPS.find((item) => item.value === normalizedGroup);
    const values = [normalizedGroup, ...(group?.subcategories || []).map((sub) => `${normalizedGroup}/${sub.value}`)];

    setSelectedCategories((prev) =>
      values.some((value) => prev.includes(value))
        ? prev.filter((category) => !values.includes(normalizeProductCategoryValue(category)))
        : [...prev, ...values]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setPriceRange([0, maxPrice]);
  };

  const closeMobileFilters = () => {
    setMobileFiltersOpen(false);
  };

  const FilterContent = ({ onClose }: { onClose?: () => void }) => (
    <div className="space-y-6">
      <div className="flex items-center justify-between lg:block">
        <h3 className="font-semibold text-lg lg:text-base">Filters</h3>
        {onClose ? (
          <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden">
            <X className="h-5 w-5" />
          </Button>
        ) : null}
      </div>

      {/* Price Filter */}
      <div>
        <h4 className="font-semibold mb-4">Price Range</h4>
        <Slider
          value={priceRange}
          onValueChange={(value) => setPriceRange([value[0], value[1]])}
          max={maxPrice}
          min={0}
          step={50}
          className="mb-4 cursor-grab active:cursor-grabbing"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>₹{priceRange[0]}</span>
          <span>₹{priceRange[1]}</span>
        </div>
      </div>

      {/* Category Filter */}
      <div>
        <h4 className="font-semibold mb-4">Category</h4>
        <div className="space-y-4">
          {PRODUCT_CATEGORY_GROUPS.map((group) => (
            <div key={group.value} className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={group.value}
                  checked={selectedCategories.some((category) => normalizeProductCategoryValue(category).startsWith(group.value))}
                  onCheckedChange={() => toggleGroup(group.value)}
                />
                <label
                  htmlFor={group.value}
                  className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {group.label}
                </label>
              </div>
              {group.subcategories?.length ? (
                <div className="ml-6 space-y-2">
                  {group.subcategories.map((sub) => {
                    const fullValue = `${group.value}/${sub.value}`;
                    return (
                      <div key={fullValue} className="flex items-center space-x-2">
                        <Checkbox
                          id={fullValue}
                          checked={selectedCategories.includes(fullValue)}
                          onCheckedChange={() => toggleCategory(fullValue)}
                        />
                        <label
                          htmlFor={fullValue}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize cursor-pointer"
                        >
                          {sub.label}
                        </label>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" className="flex-1" onClick={clearFilters}>
          Clear Filters
        </Button>
        {onClose ? (
          <Button className="flex-1" onClick={onClose}>
            Apply
          </Button>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
<Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Shop</h1>
          <p className="text-muted-foreground">
            Discover our exquisite collection of jewelry
          </p>
        </div>

        <div className="mb-6 flex items-center justify-between gap-4 lg:hidden">
          <p className="text-sm text-muted-foreground">
            Showing {filteredProducts.length} products
          </p>
          <Button variant="outline" onClick={() => setMobileFiltersOpen(true)} className="gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="space-y-6 sticky top-24">
              <FilterContent />
            </div>
          </aside>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {/* Toolbar */}
            <div className="hidden lg:flex justify-between items-center mb-6">
              <p className="text-sm text-muted-foreground">
                Showing {filteredProducts.length} products
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 border rounded-md p-1">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="position">Position</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loading ? (
              <Loading />
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  No products found matching your filters.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    clearFilters();
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6"
                    : "space-y-4"
                }
              >
                {filteredProducts.map((product, index) => (
                  <ProductCard key={product._id || product.id || index} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      {mobileFiltersOpen ? (
        <div className="fixed inset-x-0 top-20 bottom-0 z-40 lg:hidden">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 bottom-0 bg-black/50" />
          <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-background shadow-2xl border-l border-border flex flex-col">
            <div className="flex items-center justify-between border-b border-border px-4 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Browse</p>
                <h2 className="text-lg font-semibold">Filters</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={closeMobileFilters} aria-label="Close filters">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-5">
              <FilterContent />
            </div>
          </div>
        </div>
      ) : null}
      <Footer />
    </div>
  );
}
