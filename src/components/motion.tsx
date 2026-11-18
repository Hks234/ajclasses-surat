"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(true);
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        setShow(true);
        observer.disconnect();
      }
    }, { threshold: 0.08 });
    observer.observe(node);
    const fallback = window.setTimeout(() => setShow(true), 80 + delay);
    return () => {
      window.clearTimeout(fallback);
      observer.disconnect();
    };
  }, [delay]);
  return (
    <div ref={ref} className={className} style={{ transform: show ? "none" : "translateY(16px)", transition: `transform .7s ease ${delay}ms` }}>
      {children}
    </div>
  );
}

export function Marquee({ items }: { items: string[] }) {
  if (!items.length) return null;
  const loop = [...items, ...items];
  return (
    <div className="overflow-hidden border-y border-purple/10 bg-paper py-4">
      <div className="marquee-track flex w-max gap-10">
        {loop.map((item, index) => (
          <span key={`${item}-${index}`} className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-purple">{item}</span>
        ))}
      </div>
    </div>
  );
}

export function HeaderShade({ children }: { children: React.ReactNode }) {
  const [fixed, setFixed] = useState(false);
  useEffect(() => {
    const onScroll = () => setFixed(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return <header className={`site-header sticky top-0 z-40 ${fixed ? "is-fixed" : ""}`}>{children}</header>;
}

export function HeroFloats({ labels }: { labels: string[] }) {
  const spots = [
    { top: "38%", right: "38%" },
    { top: "52%", right: "14%" },
    { top: "66%", right: "30%" },
    { top: "78%", right: "10%" },
    { top: "46%", right: "48%" },
    { top: "72%", right: "44%" },
  ];
  if (!labels.length) return null;
  return (
    <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden>
      {labels.slice(0, 6).map((label, index) => (
        <span key={label} className="float-chip" style={spots[index]}>{label}</span>
      ))}
    </div>
  );
}

export function HScroll({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const go = (dir: number) => {
    const node = ref.current;
    if (!node) return;
    node.scrollBy({ left: dir * Math.min(380, node.clientWidth * 0.85), behavior: "smooth" });
  };
  return (
    <div className="relative">
      <button type="button" className={`slider-arrow ${light ? "light" : ""} left-0`} onClick={() => go(-1)} aria-label="Previous"><ChevronLeft size={20} /></button>
      <button type="button" className={`slider-arrow ${light ? "light" : ""} right-0`} onClick={() => go(1)} aria-label="Next"><ChevronRight size={20} /></button>
      <div ref={ref} className="programme-rail px-8">{children}</div>
    </div>
  );
}
