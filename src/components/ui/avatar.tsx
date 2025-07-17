"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import Image from "next/image"

import { cn } from "@/lib/utils"

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  src,
  alt,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  // If src is a remote URL string (like Google profile pictures), use Next.js Image
  if (src && typeof src === 'string' && (src.startsWith('http://') || src.startsWith('https://'))) {
    return (
      <Image
        src={src}
        alt={alt || 'Avatar'}
        fill
        className={cn("object-cover", className)}
        sizes="(max-width: 768px) 32px, 48px"
      />
    )
  }

  // For local images or when src is not provided, use the original AvatarPrimitive.Image
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      src={src}
      alt={alt}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "bg-muted flex size-full items-center justify-center rounded-full",
        className
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }
