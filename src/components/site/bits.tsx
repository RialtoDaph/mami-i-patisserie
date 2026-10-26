"use client";

import { useEffect, useRef } from "react";
import { buttonClass, Icon, type ButtonVariant, type IconName } from "@/components/brand";
import { useCart } from "./CartProvider";

/** "+ Keranjang" button. Reports the click position so the fly-to-cart animation can start there. */
export function AddButton({
  productId,
  qty,
  note,
  label = "Keranjang",
  icon = "add",
  size = "md",
  variant = "wine",
  block,
  disabled,
  className,
}: {
  productId: string;
  qty?: number;
  note?: string;
  label?: string;
  icon?: IconName | null;
  size?: "lg" | "md" | "sm";
  variant?: ButtonVariant;
  block?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const { add } = useCart();
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => add(productId, { qty, note, origin: { x: e.clientX, y: e.clientY } })}
      className={buttonClass({ variant, size, block, className })}
    >
      {icon && <Icon name={icon} size={size === "lg" ? 22 : 18} />}
      {label}
    </button>
  );
}

/** Muted looping video. Paused for prefers-reduced-motion; resumes when the tab becomes visible again. */
export function AutoVideo({ src, poster, className }: { src: string; poster?: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      if (reduce.matches || document.hidden) v.pause();
      else v.play().catch(() => {});
    };
    sync();
    reduce.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      reduce.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);
  return <video ref={ref} src={src} poster={poster} muted loop playsInline preload="metadata" aria-hidden className={className} />;
}

/** Scrolls to a section on first load (e.g. /hampers → #paket during the Christmas takeover). */
export function ScrollToSection({ id }: { id: string }) {
  useEffect(() => {
    if (window.location.hash) return;
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [id]);
  return null;
}
