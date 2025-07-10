"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface VideoTextProps {
  children: React.ReactNode;
  src?: string;
  className?: string;
  fontSize?: string | number;
  fontWeight?: string | number;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  preload?: "auto" | "metadata" | "none";
}

export default function VideoText({
  children,
  src,
  className,
  fontSize = "120",
  fontWeight = "bold",
  autoPlay = true,
  muted = true,
  loop = true,
  preload = "auto",
}: VideoTextProps) {
  return (
    <div className={cn("relative inline-block overflow-hidden", className)}>
      {src && (
        <video
          className="absolute inset-0 w-full h-full object-cover -z-10"
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
          preload={preload}
          playsInline
        >
          <source src={src} type="video/webm" />
          <source src={src} type="video/mp4" />
        </video>
      )}
      <div
        className="relative z-10 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent font-bold leading-none"
        style={{
          fontSize: typeof fontSize === "number" ? `${fontSize}px` : fontSize,
          fontWeight: fontWeight,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
        }}
      >
        {children}
      </div>
    </div>
  );
}
