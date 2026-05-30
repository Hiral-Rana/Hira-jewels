export type ProductCategoryGroup = {
  label: string;
  value: string;
  subcategories?: Array<{
    label: string;
    value: string;
  }>;
};

export const PRODUCT_CATEGORY_GROUPS: ProductCategoryGroup[] = [
  {
    label: "Festive Vibe",
    value: "festive-vibe",
    subcategories: [
      { label: "Navaratri Collection", value: "navaratri-collection" },
      { label: "Diwali Collection", value: "diwali-collection" },
    ],
  },
  {
    label: "Daily Wear",
    value: "daily-wear",
    subcategories: [
      { label: "Formal Wear", value: "formal-wear" },
      { label: "Casual Wear", value: "casual-wear" },
    ],
  },
  {
    label: "Wedding",
    value: "wedding",
    subcategories: [],
  },
];

const LEGACY_CATEGORY_MAP: Record<string, string> = {
  women: "festive-vibe/navaratri-collection",
  men: "daily-wear/formal-wear",
  kids: "wedding",
  artificial: "festive-vibe/diwali-collection",
  unisex: "daily-wear/casual-wear",
  bracelets: "festive-vibe/navaratri-collection",
  necklace: "festive-vibe/diwali-collection",
  necklaces: "festive-vibe/diwali-collection",
  earrings: "festive-vibe/diwali-collection",
};

export function normalizeProductCategoryValue(value?: string | string[]): string {
  if (Array.isArray(value)) {
    return value.length > 0 ? normalizeProductCategoryValue(value[0]) : "";
  }
  if (!value) return "";

  const normalized = value.toLowerCase().trim().replace(/\s+/g, "-").replace(/\/+/g, "/");
  return LEGACY_CATEGORY_MAP[normalized] || normalized;
}

export function getProductCategoryOptions() {
  return PRODUCT_CATEGORY_GROUPS.flatMap((group) => [
    { label: group.label, value: group.value, group: group.label },
    ...(group.subcategories || []).map((sub) => ({
      label: sub.label,
      value: `${group.value}/${sub.value}`,
      group: group.label,
    })),
  ]);
}

export function getSingleProductCategoryLabel(value?: string) {
  const normalized = normalizeProductCategoryValue(value);
  if (!normalized) return "Uncategorized";

  for (const group of PRODUCT_CATEGORY_GROUPS) {
    if (group.value === normalized) return group.label;

    for (const sub of group.subcategories || []) {
      if (`${group.value}/${sub.value}` === normalized) {
        return `${group.label} / ${sub.label}`;
      }
    }
  }

  return normalized
    .split("/")
    .map((segment) =>
      segment
        .split("-")
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    )
    .join(" / ");
}

export function getProductCategoryLabel(value?: string | string[]) {
  if (Array.isArray(value)) {
    if (value.length === 0) return "Uncategorized";
    return value.map(v => getSingleProductCategoryLabel(v)).join(", ");
  }
  return getSingleProductCategoryLabel(value);
}

export function getExpandedCategorySelection(category: string, subcategory?: string) {
  const normalizedCategory = normalizeProductCategoryValue(category);
  const normalizedSubcategory = subcategory ? subcategory.toLowerCase().trim().replace(/\s+/g, "-") : "";

  if (!normalizedCategory) return [];

  if (!normalizedSubcategory) {
    const group = PRODUCT_CATEGORY_GROUPS.find((item) => item.value === normalizedCategory);
    if (group?.subcategories?.length) {
      return [
        normalizedCategory,
        ...group.subcategories.map((sub) => `${normalizedCategory}/${sub.value}`),
      ];
    }

    return [normalizedCategory];
  }

  return [`${normalizedCategory}/${normalizedSubcategory}`];
}

export function matchesProductCategory(productCategory: string | string[], selectedCategories: string[]) {
  if (!selectedCategories.length) return true;

  const productCategories = Array.isArray(productCategory) ? productCategory : [productCategory];

  return productCategories.some(pc => {
    const normalizedProductCategory = normalizeProductCategoryValue(pc);
    const productGroup = normalizedProductCategory.split("/")[0];

    return selectedCategories.some((category) => {
      const normalizedSelected = normalizeProductCategoryValue(category);
      if (!normalizedSelected) return false;

      if (normalizedSelected === normalizedProductCategory) return true;
      return normalizedSelected === productGroup;
    });
  });
}
