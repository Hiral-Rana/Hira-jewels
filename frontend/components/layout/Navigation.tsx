"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRODUCT_CATEGORY_GROUPS } from "@/lib/productCategories";

interface NavigationProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const categories = PRODUCT_CATEGORY_GROUPS.map((group) => ({
  name: group.label,
  href: `/shop?category=${encodeURIComponent(group.value)}`,
  subcategories: (group.subcategories || []).map((sub) => ({
    name: sub.label,
    href: `/shop?category=${encodeURIComponent(group.value)}&subcategory=${encodeURIComponent(sub.value)}`,
  })),
}));

export default function Navigation({ isOpen = false, onClose }: NavigationProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mounted, setMounted] = useState(isOpen);
    const [entered, setEntered] = useState(false);
  const animTimer = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      // small delay so the element is mounted with the off-screen class applied,
      // then setEntered to true so the CSS transition animates the drawer in.
      if (animTimer.current) {
        clearTimeout(animTimer.current);
      }
      animTimer.current = window.setTimeout(() => setEntered(true), 30);
    } else {
      // start exit animation
      setEntered(false);
      // unmount after animation
      if (animTimer.current) {
        clearTimeout(animTimer.current);
      }
      animTimer.current = window.setTimeout(() => setMounted(false), 500);
    }
    return () => {
      if (animTimer.current) {
        clearTimeout(animTimer.current);
        animTimer.current = null;
      }
    };
  }, [isOpen]);

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:block border-t bg-background">
        <div className="container mx-auto px-4">
          <ul className="flex items-center gap-1">
            <Link
              href="/"
              className="block px-4 py-2 text-sm font-medium hover:text-primary"
              onClick={onClose}
            >
              Home
            </Link>
            <Link
              href="/shop"
              className="block px-4 py-2 text-sm font-medium hover:text-primary"
              onClick={onClose}
            >
              Catalogue
            </Link>
            {categories.map((category) => (
              <li
                key={category.name}
                className="relative group"
                onMouseEnter={() => setOpenDropdown(category.name)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <Link
                  href={category.href}
                  className="flex items-center gap-1 px-4 py-4 text-sm font-medium hover:text-primary transition-colors"
                >
                  {category.name}
                  {category.subcategories && category.subcategories.length > 0 && (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Link>
                {category.subcategories && category.subcategories.length > 0 && (
                  <div
                    className={cn(
                      "absolute top-full left-0 bg-popover border rounded-md shadow-lg min-w-[200px] py-2 transition-all",
                      openDropdown === category.name
                        ? "opacity-100 visible"
                        : "opacity-0 invisible pointer-events-none"
                    )}
                  >
                    {category.subcategories.map((sub) => (
                      <Link
                        key={sub.name}
                        href={sub.href}
                        className="block px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                        onClick={onClose}
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            ))}
            <li>
              <Link
                href="/custom"
                className="block px-4 py-4 text-sm font-medium hover:text-primary transition-colors"
              >
                Studio
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="block px-4 py-4 text-sm font-medium hover:text-primary transition-colors"
              >
                Contact
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Mobile Slide-over Drawer */}
      {mounted &&
        (typeof window !== 'undefined' ? createPortal(
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              onClick={onClose}
              className={`absolute inset-0 bg-black/40 transition-opacity duration-400 ease-[cubic-bezier(.2,.9,.3,1)] ${entered ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* Drawer */}
            <aside className={`relative bg-background w-4/5 max-w-xs h-full transform transition-transform duration-500 ease-[cubic-bezier(.2,.9,.3,1)] ${entered ? 'translate-x-0' : '-translate-x-full'} shadow-2xl ring-1 ring-black/10` }>
              <div className="p-4 py-6 overflow-y-auto h-full">
                <div className="mb-4 flex items-center justify-between">
                  <Link href="/" onClick={onClose} className="font-bold text-lg">HIRA𓊆𓊇JEWELS</Link>
                  <button onClick={onClose} aria-label="Close menu" className="p-2 rounded hover:bg-muted">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
                <div className="space-y-2">
                  <Link href="/" className="block px-2 py-2 text-sm font-medium hover:text-primary" onClick={onClose}>Home</Link>
                  <Link href="/shop" className="block px-2 py-2 text-sm font-medium hover:text-primary" onClick={onClose}>Catalogue</Link>
                  {categories.map((category) => (
                    <div key={category.name}>
                      <Link href={category.href} className="block px-2 py-2 text-sm font-medium hover:text-primary" onClick={onClose}>{category.name}</Link>
                      {category.subcategories && (
                        <div className="pl-4 space-y-1">
                          {category.subcategories.map((sub) => (
                            <Link key={sub.name} href={sub.href} className="block px-2 py-2 text-sm text-muted-foreground hover:text-primary" onClick={onClose}>{sub.name}</Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  <Link href="/custom" className="block px-2 py-2 text-sm font-medium hover:text-primary" onClick={onClose}>Studio</Link>
                  <Link href="/contact" className="block px-2 py-2 text-sm font-medium hover:text-primary" onClick={onClose}>Contact</Link>
                </div>
              </div>
            </aside>

            {/* Right-side visible area (not covered by drawer) */}
            <div className="flex-1" aria-hidden />
          </div>, document.body) : null)}
    </>
  );
}
