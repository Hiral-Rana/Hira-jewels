"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Image as ImageIcon, X, Check } from "lucide-react";
import Image from "next/image";
import { buildProductGallery } from "@/lib/images";
import { PRODUCT_CATEGORY_GROUPS, normalizeProductCategoryValue } from "@/lib/productCategories";

interface ProductFormProps {
  initialData?: any;
  isEditing?: boolean;
}

export default function ProductForm({ initialData, isEditing = false }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: initialData?.title || initialData?.name || "",
    originalPrice: initialData?.originalPrice?.toString() || "",
    discountPrice: initialData?.discountPrice?.toString() || initialData?.price?.toString() || "",
    inStock: initialData?.inStock ?? true,
    category: Array.isArray(initialData?.category) ? initialData.category : (initialData?.category ? [initialData.category] : []),
    description: initialData?.description || "",
    details: initialData?.details || "",
    properties: {
      material: initialData?.properties?.material || "",
      weight: initialData?.properties?.weight || "",
      style: initialData?.properties?.style || "",
    },
    tags: initialData?.tags || [],
    images: initialData?.images || [],
  });

  const [mainImage, setMainImage] = useState(initialData?.image || "");

  const validateSquareImage = (file: File) => {
    return new Promise<boolean>((resolve) => {
      const objectUrl = URL.createObjectURL(file);
      const previewImage = new window.Image();

      previewImage.onload = () => {
        const isSquare = previewImage.width === previewImage.height;
        URL.revokeObjectURL(objectUrl);
        resolve(isSquare);
      };

      previewImage.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(false);
      };

      previewImage.src = objectUrl;
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (formData.images.length + files.length > 3) {
      toast.error("Maximum 3 images allowed");
      return;
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    for (const file of Array.from(files)) {
      if (file.size > 250 * 1024) {
        toast.error(`File ${file.name} is too large. Maximum size is 250 KB.`);
        continue;
      }

      const isSquare = await validateSquareImage(file);
      if (!isSquare) {
        toast.error(`File ${file.name} must be a square image (equal width and height).`);
        continue;
      }

      if (!cloudName || !uploadPreset) {
        // Fallback to Base64 if Cloudinary is not configured yet
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setFormData((prev) => ({
            ...prev,
            images: [...prev.images, base64String],
          }));
          if (!mainImage) setMainImage(base64String);
        };
        reader.readAsDataURL(file);
      } else {
        // Cloudinary Upload
        setLoading(true);
        const data = new FormData();
        data.append("file", file);
        data.append("upload_preset", uploadPreset);

        try {
          const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: "POST",
            body: data,
          });
          const uploadedImage = await res.json();
          if (uploadedImage.secure_url) {
            setFormData((prev) => ({
              ...prev,
              images: [...prev.images, uploadedImage.secure_url],
            }));
            if (!mainImage) setMainImage(uploadedImage.secure_url);
            toast.success("Image uploaded successfully!");
          } else {
            toast.error("Failed to upload image to Cloudinary.");
          }
        } catch (err) {
          console.error("Cloudinary upload error:", err);
          toast.error("An error occurred during image upload.");
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const removeImage = (indexToRemove: number) => {
    setFormData((prev) => {
      const newImages = prev.images.filter((_: string, index: number) => index !== indexToRemove);
      if (mainImage === prev.images[indexToRemove]) {
        setMainImage(newImages[0] || "");
      }
      return { ...prev, images: newImages };
    });
  };

  const toggleTag = (tag: string) => {
    setFormData((prev) => {
      const newTags = prev.tags.includes(tag)
        ? prev.tags.filter((t: string) => t !== tag)
        : [...prev.tags, tag];
      return { ...prev, tags: newTags };
    });
  };

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || formData.category.length === 0 || !formData.discountPrice) {
      toast.error("Title, at least one Category, and Discount Price are required fields.");
      return;
    }

    if (formData.images.length > 3) {
      toast.error("Maximum 3 images allowed.");
      return;
    }

    setLoading(true);

    const payload = {
      name: formData.title,
      slug: slugify(formData.title),
      price: parseFloat(formData.discountPrice),
      originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
      description: formData.description,
      details: formData.details,
      category: formData.category.map((c: string) => normalizeProductCategoryValue(c)).filter(Boolean),
      image: mainImage || formData.images[0] || "",
      images: buildProductGallery(mainImage || formData.images[0] || "", formData.images),
      inStock: formData.inStock,
      properties: formData.properties,
      tags: formData.tags,
    };

    try {
      const url = isEditing
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/products/${initialData._id || initialData.id}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/products`;
      
      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(isEditing ? "Product updated successfully!" : "Product added successfully!");
        router.push("/admin/products");
      } else {
        toast.error(data.error || "Failed to save product.");
      }
    } catch (error) {
      console.error("Save product error:", error);
      toast.error("An error occurred while saving the product.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          {isEditing ? "Edit Product" : "Create New Product"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form Fields */}
        <div className="lg:col-span-2 space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Main details of your product.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Product Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Diamond Stud Earrings"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discountPrice">Discount Price (Selling Price) *</Label>
                  <Input
                    id="discountPrice"
                    type="number"
                    value={formData.discountPrice}
                    onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                    placeholder="e.g. 15000"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="originalPrice">Original Price</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                    placeholder="e.g. 18000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categories *</Label>
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-3 border border-input rounded-md bg-background">
                    {PRODUCT_CATEGORY_GROUPS.flatMap(group => [
                      { label: group.label, value: group.value },
                      ...(group.subcategories || []).map(sub => ({
                        label: `${group.label} / ${sub.label}`,
                        value: `${group.value}/${sub.value}`
                      }))
                    ]).map(cat => (
                      <label key={cat.value} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.category.includes(cat.value)}
                          onChange={(e) => {
                            const newCategories = e.target.checked
                              ? [...formData.category, cat.value]
                              : formData.category.filter((c: string) => c !== cat.value);
                            setFormData({ ...formData, category: newCategories });
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm">{cat.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <input
                    type="checkbox"
                    id="inStock"
                    checked={formData.inStock}
                    onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="inStock" className="cursor-pointer">In Stock</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Short description of the product..."
                  className="h-24"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="details">Product Details (Long Description)</Label>
                <Textarea
                  id="details"
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  placeholder="Detailed information about the product..."
                  className="h-32"
                />
              </div>
            </CardContent>
          </Card>

          {/* Properties Section */}
          <Card>
            <CardHeader>
              <CardTitle>Properties Section</CardTitle>
              <CardDescription>Detailed specifications.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="material">Material</Label>
                <Input
                  id="material"
                  value={formData.properties.material}
                  onChange={(e) => setFormData({ ...formData, properties: { ...formData.properties, material: e.target.value } })}
                  placeholder="e.g. 18K Gold"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight</Label>
                <Input
                  id="weight"
                  value={formData.properties.weight}
                  onChange={(e) => setFormData({ ...formData, properties: { ...formData.properties, weight: e.target.value } })}
                  placeholder="e.g. 5.2g"
                />
              </div>
              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="style">Style</Label>
                <Input
                  id="style"
                  value={formData.properties.style}
                  onChange={(e) => setFormData({ ...formData, properties: { ...formData.properties, style: e.target.value } })}
                  placeholder="e.g. Vintage"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Images & Tags */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
              <CardDescription>
                Upload up to 3 square images. Each image must be 250 KB or smaller.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{formData.images.length}/3 images uploaded</span>
                <span>Square images only</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {formData.images.map((img: string, idx: number) => (
                  <div key={idx} className="relative aspect-square rounded-lg border overflow-hidden group">
                    {/* Only valid image sources */}
                    {img && typeof img === 'string' && (img.startsWith('http') || img.startsWith('data:') || img.startsWith('/')) ? (
                      <Image src={img} alt={`Preview ${idx}`} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">Invalid</div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    {mainImage === img && (
                      <div className="absolute bottom-0 inset-x-0 bg-primary text-primary-foreground text-xs text-center py-1">
                        Main Image
                      </div>
                    )}
                  </div>
                ))}
                {formData.images.length < 3 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors"
                  >
                    <ImageIcon className="h-8 w-8 mb-2" />
                    <span className="text-sm">Upload</span>
                  </button>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
              />
              <p className="text-xs text-muted-foreground">
                First uploaded image becomes the main thumbnail. Use square images for the best storefront display.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tags Section</CardTitle>
              <CardDescription>Select tags to highlight product.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {["popular", "new", "sale"].map((tag) => {
                  const isSelected = formData.tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors flex items-center gap-2 ${
                        isSelected 
                          ? "bg-primary text-primary-foreground border-primary" 
                          : "bg-background text-foreground hover:bg-muted"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                      <span className="capitalize">{tag}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Button 
            type="submit" 
            className="w-full h-12 text-lg font-bold"
            disabled={loading}
          >
            {loading ? "Saving..." : (isEditing ? "Update Product" : "Save Product")}
          </Button>
        </div>
      </form>
    </div>
  );
}
