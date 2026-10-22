"use client";

import { useEffect, useState } from "react";

/** True once the page is scrolled past `threshold` px. */
export function useScrolled(threshold = 140): boolean {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > threshold);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [threshold]);
  return scrolled;
}
