"use client";

import React, { ElementType } from "react";
import { cn } from "@/lib/utils";

interface LineShadowTextProps {
  children: string;
  shadowColor?: string;
  as?: ElementType;
  className?: string;
}

export default function LineShadowText({
  children,
  shadowColor = "black",
  as: Component = "span",
  className,
}: LineShadowTextProps) {
  return (
    <Component
      className={cn(
        "relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground",
        className
      )}
      style={{
        textShadow: `0 0 0 ${shadowColor}`,
        WebkitTextStroke: `1px ${shadowColor}`,
      }}
    >
      <span
        className="absolute inset-0 animate-pulse"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${shadowColor} 50%, transparent 100%)`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
        }}
      >
        {children}
      </span>
      <span className="relative z-10 bg-gradient-to-r from-foreground to-foreground bg-clip-text text-transparent">
        {children}
      </span>
    </Component>
  );
}
