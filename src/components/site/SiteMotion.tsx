"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import type { SnowMode } from "@/lib/site/config";

// Website motion layer (design handoff WEB.md "Motion & efek"). Everything here is skipped when the visitor
// prefers reduced motion. Pages only mark elements (data-tilt, data-glare, data-twinkle, #nt-*); this file animates them.

const EASE = "cubic-bezier(.2,.8,.2,1)";
const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function SiteMotion({ snow }: { snow: SnowMode }) {
  const path = usePathname();

  // Snow: "semua" = fixed full-viewport canvas over every page, "hero" = only inside the Christmas hero.
  useEffect(() => {
    if (reduced() || snow === "mati") return;
    let canvas: HTMLCanvasElement | null = null;
    let own = false;
    if (snow === "semua") {
      canvas = document.createElement("canvas");
      canvas.setAttribute("aria-hidden", "true");
      canvas.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:60";
      document.body.appendChild(canvas);
      own = true;
    } else {
      canvas = document.getElementById("nt-snow") as HTMLCanvasElement | null;
    }
    if (!canvas) return;
    return runSnow(canvas, snow === "semua", () => own && canvas?.remove());
  }, [snow, path]);

  // Christmas hero: intro + twinkling lights.
  useEffect(() => {
    if (reduced()) return;
    const anims: Animation[] = [];
    const h1 = document.getElementById("nt-h1");
    if (h1) {
      anims.push(h1.animate([{ opacity: 0, transform: "translateY(28px)", filter: "blur(8px)" }, { opacity: 1, transform: "none", filter: "blur(0)" }], { duration: 1000, easing: EASE, fill: "backwards" }));
      const em = h1.querySelector("em");
      if (em) anims.push(em.animate([{ opacity: 0, filter: "blur(10px)" }, { opacity: 1, filter: "blur(0)" }], { duration: 1300, delay: 420, easing: EASE, fill: "backwards" }));
    }
    const bar = document.getElementById("nt-bar");
    if (bar) anims.push(bar.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: 1500, delay: 600, easing: EASE, fill: "backwards" }));
    const photo = document.getElementById("nt-photo");
    if (photo) {
      const drop = photo.animate(
        [{ opacity: 0, transform: "translateY(-60px) rotate(-8deg)" }, { opacity: 1, transform: "translateY(0) rotate(2.5deg)" }],
        { duration: 1100, delay: 200, easing: "cubic-bezier(.3,1.4,.5,1)", fill: "backwards" },
      );
      anims.push(drop);
      drop.onfinish = () => {
        if (photo.isConnected)
          anims.push(photo.animate([{ transform: "translateY(0) rotate(2.5deg)" }, { transform: "translateY(-10px) rotate(1.2deg)" }], { duration: 3600, iterations: Infinity, direction: "alternate", easing: "ease-in-out" }));
      };
    }
    document.querySelectorAll<HTMLElement>("[data-twinkle]").forEach((d, i) =>
      anims.push(
        d.animate([{ opacity: 1, transform: "scale(1)" }, { opacity: 0.3, transform: "scale(.8)" }], {
          duration: 700 + ((i * 137) % 900),
          delay: (i * 211) % 1300,
          iterations: Infinity,
          direction: "alternate",
          easing: "ease-in-out",
        }),
      ),
    );
    return () => anims.forEach((a) => a.cancel());
  }, [path]);

  // Reveal on scroll: headings and cards below the fold fade up as they enter (stagger 90ms per column).
  useEffect(() => {
    if (reduced()) return;
    const main = document.querySelector("main");
    if (!main) return;
    const els = [...main.querySelectorAll<HTMLElement>("section h2, section h3, article, [data-reveal]")].filter(
      (el) => el.getBoundingClientRect().top > window.innerHeight * 0.85,
    );
    const pending = new Set(els);
    const timers: ReturnType<typeof setTimeout>[] = [];
    const show = (el: HTMLElement) => {
      el.style.opacity = "1";
      el.style.translate = "0 0";
      pending.delete(el);
      // Hand the element back to its own (class-based) hover transitions once revealed.
      timers.push(setTimeout(() => (el.style.transition = ""), 1200));
    };
    els.forEach((el) => {
      const i = el.parentElement ? [...el.parentElement.children].indexOf(el) % 4 : 0;
      el.style.opacity = "0";
      el.style.translate = "0 24px";
      el.style.transition = `opacity .7s ease ${i * 90}ms, translate .7s ${EASE} ${i * 90}ms`;
    });
    const check = () => pending.forEach((el) => el.getBoundingClientRect().top < window.innerHeight * 0.92 && show(el));
    check();
    window.addEventListener("scroll", check, { passive: true });
    const fallback = setTimeout(() => pending.forEach(show), 4000);
    return () => {
      window.removeEventListener("scroll", check);
      clearTimeout(fallback);
      timers.forEach(clearTimeout);
      els.forEach((el) => {
        el.style.opacity = "";
        el.style.translate = "";
        el.style.transition = "";
      });
    };
  }, [path]);

  // 3D tilt + glare following the mouse (mouse pointers only).
  useEffect(() => {
    if (reduced() || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let current: HTMLElement | null = null;
    const reset = (el: HTMLElement) => {
      el.style.transition = `transform .6s ${EASE}`;
      el.style.transform = "";
      const g = el.querySelector<HTMLElement>("[data-glare]");
      if (g) g.style.opacity = "0";
    };
    const onMove = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.<HTMLElement>("[data-tilt]") ?? null;
      if (current && current !== el) reset(current);
      current = el;
      if (!el) return;
      const max = el.dataset.tilt === "hero" ? 14 : el.dataset.tilt === "card" ? 10 : 6;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transition = "transform .12s ease-out";
      el.style.transform = `perspective(1000px) rotateY(${(px * max).toFixed(2)}deg) rotateX(${(-py * max).toFixed(2)}deg)${el.dataset.tilt === "board" ? "" : " scale(1.02)"}`;
      const g = el.querySelector<HTMLElement>("[data-glare]");
      if (g) {
        g.style.opacity = "1";
        g.style.background = `radial-gradient(circle at ${((px + 0.5) * 100).toFixed(0)}% ${((py + 0.5) * 100).toFixed(0)}%, rgb(255 255 255 / .42), rgb(255 255 255 / 0) 55%)`;
      }
    };
    document.addEventListener("mousemove", onMove);
    return () => {
      document.removeEventListener("mousemove", onMove);
      if (current) reset(current);
    };
  }, [path]);

  // Fly to cart: a wine dot arcs from the click to the visible cart button, which then pops.
  useEffect(() => {
    const onAdd = (e: Event) => {
      if (reduced()) return;
      const { x, y } = (e as CustomEvent<{ x: number; y: number }>).detail;
      const target = [...document.querySelectorAll<HTMLElement>("[data-cart-target]")].find((t) => {
        const r = t.getBoundingClientRect();
        return r.width > 0 && r.top > -10 && r.top < window.innerHeight && getComputedStyle(t.closest("header") ?? t).opacity !== "0";
      });
      if (!target) return;
      const r = target.getBoundingClientRect();
      const dot = document.createElement("div");
      dot.setAttribute("aria-hidden", "true");
      dot.style.cssText =
        "position:fixed;z-index:200;left:0;top:0;width:18px;height:18px;border-radius:50%;background:var(--color-brand-wine);box-shadow:0 0 0 3px var(--color-brand-butter);pointer-events:none";
      document.body.appendChild(dot);
      const x0 = x - 9, y0 = y - 9, x1 = r.left + r.width / 2 - 9, y1 = r.top + r.height / 2 - 9;
      const a = dot.animate(
        [
          { transform: `translate(${x0}px,${y0}px) scale(1)` },
          { transform: `translate(${(x0 + x1) / 2}px,${Math.min(y0, y1) - 80}px) scale(.9)`, offset: 0.5 },
          { transform: `translate(${x1}px,${y1}px) scale(.4)`, opacity: 0.6 },
        ],
        { duration: 650, easing: "cubic-bezier(.4,0,.2,1)" },
      );
      a.onfinish = () => {
        dot.remove();
        target.animate([{ transform: "scale(1)" }, { transform: "scale(1.25)" }, { transform: "scale(1)" }], { duration: 380, easing: "ease-out" });
      };
    };
    window.addEventListener("mami:cart-add", onAdd);
    return () => window.removeEventListener("mami:cart-add", onAdd);
  }, []);

  return null;
}

/** Snow flakes with depth, sine sway, wind from the mouse and flakes that dodge the cursor. Returns a cleanup. */
function runSnow(canvas: HTMLCanvasElement, light: boolean, onStop: () => void): () => void {
  type Flake = { x: number; y: number; z: number; r: number; vy: number; ph: number; sw: number; o: number };
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const mouse = { x: -9999, y: -9999, wind: 0 };
  const flakes: Flake[] = [];
  let W = 0, H = 0, wind = 0, raf = 0;
  let ctx: CanvasRenderingContext2D | null = null;

  const make = (anywhere: boolean): Flake => {
    const z = Math.random();
    return { x: Math.random() * W, y: anywhere ? Math.random() * H : -8 - Math.random() * 40, z, r: 0.7 + z * z * 3.2, vy: 0.3 + z * 1.2, ph: Math.random() * 6.283, sw: 0.4 + Math.random() * 0.9, o: 0.35 + z * 0.6 };
  };
  const onMouse = (e: MouseEvent) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.wind = (e.clientX / window.innerWidth - 0.5) * 1.4;
  };
  window.addEventListener("mousemove", onMouse, { passive: true });

  const tick = () => {
    raf = requestAnimationFrame(tick); // rAF itself stops while the tab is hidden
    const r = canvas.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight || !r.width) return; // off screen: skip the frame
    if (!ctx || Math.round(r.width) !== W || Math.round(r.height) !== H) {
      W = Math.round(r.width);
      H = Math.round(r.height);
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      flakes.length = 0;
      const n = Math.round(Math.min(light ? 140 : 220, (W * H) / (light ? 12000 : 4200)));
      for (let i = 0; i < n; i++) flakes.push(make(true));
    }
    ctx.clearRect(0, 0, W, H);
    wind += (mouse.wind - wind) * 0.02;
    const mx = mouse.x - r.left, my = mouse.y - r.top;
    for (const f of flakes) {
      f.ph += 0.012 * f.sw;
      f.y += f.vy;
      f.x += Math.sin(f.ph) * 0.45 * f.sw + wind * (0.3 + f.z);
      const dx = f.x - mx, dy = f.y - my, d2 = dx * dx + dy * dy;
      if (d2 < 8100) {
        const d = Math.sqrt(d2) || 1, q = ((90 - d) / 90) * 2.4;
        f.x += (dx / d) * q;
        f.y += (dy / d) * q * 0.6;
      }
      if (f.y > H + 8) Object.assign(f, make(false));
      if (f.x > W + 8) f.x = -8;
      else if (f.x < -8) f.x = W + 8;
      ctx.globalAlpha = f.o;
      ctx.fillStyle = light ? "#ffffff" : "#fcf8e6";
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, 6.283);
      ctx.fill();
      if (light) {
        // Thin espresso outline so white flakes stay visible on the cream background.
        ctx.strokeStyle = "rgb(62 39 35 / .22)";
        ctx.lineWidth = 0.6;
        ctx.stroke();
      } else if (f.z > 0.86) {
        ctx.globalAlpha = f.o * 0.18;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r * 2.6, 0, 6.283);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  };
  raf = requestAnimationFrame(tick);
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("mousemove", onMouse);
    onStop();
  };
}
