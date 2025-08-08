"use client";

import Link from "next/link";
import React, { useCallback, useRef, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

type ThreeDCTAButtonProps = {
  href: string;
  label: string;
  className?: string;
  ariaLabel?: string;
};

export default function ThreeDCTAButton({ href, label, className, ariaLabel }: ThreeDCTAButtonProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<string>("rotateX(0deg) rotateY(0deg) scale(1)");
  const [glowX, setGlowX] = useState<number>(50);
  const [glowY, setGlowY] = useState<number>(50);

  const handleMove = useCallback((e: React.MouseEvent) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const midX = rect.width / 2;
    const midY = rect.height / 2;
    const rotateMax = 10; // degrees
    const rotateY = ((x - midX) / midX) * rotateMax; // left/right
    const rotateX = -((y - midY) / midY) * rotateMax; // up/down
    setTransform(`rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale(1.03)`);
    setGlowX((x / rect.width) * 100);
    setGlowY((y / rect.height) * 100);
  }, []);

  const reset = useCallback(() => {
    setTransform("rotateX(0deg) rotateY(0deg) scale(1)");
  }, []);

  return (
    <div
      className={[
        "relative mx-auto",
        "[perspective:1200px]",
        className || "",
      ].join(" ")}
    >
      {/* Outer gradient ring */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-1 rounded-2xl opacity-80 blur-md transition-opacity duration-500"
        style={{
          background:
            "conic-gradient(from 0deg, rgba(37,99,235,0.6), rgba(59,130,246,0.6), rgba(96,165,250,0.6), rgba(37,99,235,0.6))",
          filter: "saturate(1.2)",
          animation: "huerotate 12s linear infinite",
        }}
      />

      {/* 3D Card wrapped by Link for reliable navigation */}
      <Link
        href={href}
        aria-label={ariaLabel || label}
        prefetch
        className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 cursor-pointer"
      >
        <div
          ref={cardRef}
          onMouseMove={handleMove}
          onMouseLeave={reset}
          className="relative will-change-transform select-none"
          style={{ transformStyle: "preserve-3d", transform }}
        >
          {/* Base layer */}
          <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-blue-700 via-blue-500 to-blue-300 shadow-[0_20px_50px_rgba(2,6,23,0.5)]">
            {/* Subtle AI grid overlay */}
            <div className="pointer-events-none absolute inset-0 opacity-20">
              <div className="grid-overlay size-full" />
            </div>

            {/* Dynamic glow that follows cursor */}
            <div
              className="pointer-events-none absolute -inset-8 rounded-3xl opacity-40"
              style={{
                background: `radial-gradient(600px circle at ${glowX}% ${glowY}%, rgba(255,255,255,0.25), transparent 40%)`,
                transition: "background 120ms linear",
                transform: "translateZ(40px)",
              }}
            />

            {/* Shimmer sweep */}
            <div className="pointer-events-none shimmer absolute inset-0 rounded-2xl" style={{ transform: "translateZ(50px)" }} />

            {/* Content layer */}
            <div
              className="relative z-10 flex items-center justify-center gap-3 px-10 py-5 text-white"
              style={{ transform: "translateZ(60px)" }}
            >
              {/* Label */}
              <span className="text-lg font-extrabold tracking-wide drop-shadow-md">
                <span className="align-middle inline-flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  {label}
                </span>
              </span>

              <ArrowRight className="h-5 w-5" />
            </div>

            {/* Bottom accent to add depth */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
        </div>
      </Link>
    </div>
  );
}
