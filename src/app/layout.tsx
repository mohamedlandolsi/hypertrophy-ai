import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from 'next/cache';
import Navbar from '@/components/navbar'; // Import the Navbar component

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Coach",
  description: "Your personal AI fitness coach",
};

async function signOutAction() {
  'use server';
  const supabase = await createClient();
  
  // Sign out from Supabase
  await supabase.auth.signOut();
  
  // Revalidate multiple paths to ensure cache is cleared
  revalidatePath('/', 'layout');
  revalidatePath('/dashboard');
  revalidatePath('/login');
  
  // Redirect to home page
  redirect('/');
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
