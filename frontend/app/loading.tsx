"use client";

import { useEffect, useState } from "react";

const PHRASES = [
  "Loading products...",
  "Products on the way...",
  "Get ready to buy!",
  "Almost there...",
  "Fetching best deals...",
];

export default function Loading() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // snappier cadence: 1200ms interval and quicker fade
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % PHRASES.length);
        setVisible(true);
      }, 120);
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/70 backdrop-blur-md">
      <div className="flex flex-col items-center gap-6">
        {/* Modern Double Spinner */}
        <div className="relative flex items-center justify-center w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>

        <p
          aria-live="polite"
          className="text-sm font-semibold tracking-wide text-slate-600 uppercase transition-opacity duration-100"
          style={{ opacity: visible ? 1 : 0 }}
        >
          {PHRASES[index]}
        </p>
      </div>
    </div>
  );
}
