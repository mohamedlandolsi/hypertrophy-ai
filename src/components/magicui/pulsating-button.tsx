"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface PulsatingButtonProps {
  children: React.ReactNode;
  className?: string;
  pulseColor?: string;
  duration?: string;
}

export default function PulsatingButton({
  children,
  className,
  pulseColor = "59, 130, 246",
  duration = "1.5s",
  ...props
}: PulsatingButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "relative text-center cursor-pointer flex justify-center items-center rounded-md text-white dark:text-black px-4 py-2",
        className,
      )}
      style={{
        "--pulse-color": pulseColor,
        "--duration": duration,
      } as React.CSSProperties}
      {...props}
    >
      <div className="relative z-10">{children}</div>
      <div className="absolute top-1/2 left-1/2 size-full rounded-md bg-inherit animate-pulse -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute top-1/2 left-1/2 size-full rounded-md bg-inherit animate-ping -translate-x-1/2 -translate-y-1/2" />
    </button>
  );
}
