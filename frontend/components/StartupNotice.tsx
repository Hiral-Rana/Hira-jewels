"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";

export default function StartupNotice() {
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia?.("(max-width: 640px)");
    const mobile = mq ? mq.matches : window.innerWidth <= 640;
    setIsMobile(mobile);

    try {
      const shown = localStorage.getItem("hj_notice_shown");
      // Only show when visiting the cart page and not dismissed
      if (!shown && (pathname === "/cart" || pathname === "/cart/")) {
        setTimeout(() => setVisible(true), 500);
      }
    } catch (e) {
      if (pathname === "/cart" || pathname === "/cart/") setVisible(true);
    }

    // listen for viewport changes to update isMobile
    const handler = (ev: MediaQueryListEvent) => setIsMobile(ev.matches);
    if (mq && mq.addEventListener) mq.addEventListener("change", handler);
    return () => {
      if (mq && mq.removeEventListener) mq.removeEventListener("change", handler);
    };
  }, [pathname]);

  const close = () => {
    try {
      localStorage.setItem("hj_notice_shown", "1");
    } catch (e) {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  const showOnCart = pathname === "/cart" || pathname === "/cart/";

  // If we're on the cart page, show modal on mobile, bottom-right on desktop
  if (showOnCart) {
    if (isMobile) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-4 shadow-lg text-sm">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Important — Order & Shipping</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Hirajewels currently does not ship items immediately. After you place an order,
                  our team will contact you to verify details and provide an estimated fulfilment
                  time — some pieces are made to order. Please enter accurate contact and delivery
                  information at checkout.
                </p>
                <p className="mt-2 text-sm">
                  Have questions? Visit our{' '}
                  <Link href="/contact" className="font-medium text-primary underline">
                    Contact Us
                  </Link>{' '}
                  page.
                </p>
              </div>
              <div className="flex flex-col items-end">
                <button aria-label="Close notice" onClick={close} className="p-1 rounded hover:bg-muted/50">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={close}
                className="inline-flex items-center rounded-md bg-primary px-3 py-1 text-sm font-medium text-primary-foreground hover:opacity-95"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      );
    }
    // Desktop: bottom-right
    return (
      <div
        role="dialog"
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 w-80 max-w-sm rounded-lg border border-border bg-card p-4 shadow-lg text-sm"
      >
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-base">Important — Order & Shipping</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Hirajewels currently does not ship items immediately. After you place an order,
              our team will contact you to verify details and provide an estimated fulfilment
              time — some pieces are made to order. Please enter accurate contact and delivery
              information at checkout.
            </p>
            <p className="mt-2 text-sm">
              Have questions? Visit our{' '}
              <Link href="/contact" className="font-medium text-primary underline">
                Contact Us
              </Link>{' '}
              page.
            </p>
          </div>
          <div className="flex flex-col items-end">
            <button aria-label="Close notice" onClick={close} className="p-1 rounded hover:bg-muted/50">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={close}
            className="inline-flex items-center rounded-md bg-primary px-3 py-1 text-sm font-medium text-primary-foreground hover:opacity-95"
          >
            Got it
          </button>
        </div>
      </div>
    );
  }
  // Otherwise: do not render on non-cart pages
  return null;
}
