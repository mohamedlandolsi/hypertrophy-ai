'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/theme-toggle';

export default function ThemeShowcase() {
  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Improved Theme Showcase</h1>
        <p className="text-muted-foreground text-lg">
          Experience the enhanced color palette designed for better readability and visual comfort
        </p>
        <div className="flex justify-center">
          <ThemeToggle />
        </div>
      </div>

      {/* Color Palette Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Color Palette</CardTitle>
          <CardDescription>
            Our improved colors provide better contrast and reduced eye strain
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-primary rounded-lg">
              <div className="text-primary-foreground font-semibold">Primary</div>
              <div className="text-xs text-primary-foreground/80 mt-1">Actions & Links</div>
            </div>
            <div className="text-center p-4 bg-secondary rounded-lg">
              <div className="text-secondary-foreground font-semibold">Secondary</div>
              <div className="text-xs text-secondary-foreground/80 mt-1">Supporting Elements</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-muted-foreground font-semibold">Muted</div>
              <div className="text-xs text-muted-foreground/80 mt-1">Subtle Content</div>
            </div>
            <div className="text-center p-4 bg-accent rounded-lg">
              <div className="text-accent-foreground font-semibold">Accent</div>
              <div className="text-xs text-accent-foreground/80 mt-1">Highlights</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* UI Components Demo */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Form Elements</CardTitle>
            <CardDescription>
              Enhanced readability with softer contrasts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" placeholder="Enter your email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <textarea 
                id="message"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Type your message here..."
              />
            </div>
            <div className="flex gap-2">
              <Button>Primary Button</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content Elements</CardTitle>
            <CardDescription>
              Improved hierarchy and visual comfort
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Typography Levels</h3>
              <p className="text-foreground">
                Primary text with improved warmth and reduced harshness for comfortable reading.
              </p>
              <p className="text-muted-foreground">
                Secondary text with better contrast ratios for accessibility and clarity.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Status Indicators</h4>
              <div className="flex gap-2 flex-wrap">
                <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">Default</span>
                <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">Secondary</span>
                <span className="inline-flex items-center rounded-md bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive ring-1 ring-inset ring-destructive/20">Error</span>
                <span className="inline-flex items-center rounded-md border border-border bg-background px-2 py-1 text-xs font-medium">Outline</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Theme Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Theme Benefits</CardTitle>
          <CardDescription>
            Key improvements in the new color scheme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-primary">Light Mode Improvements</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <span>Soft off-white background reduces eye strain</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <span>Warm gray text instead of harsh black</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <span>Subtle blue-gray primary for better engagement</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <span>Softer borders and improved contrast</span>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-primary">Dark Mode Improvements</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <span>Lighter dark backgrounds for better clarity</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <span>Enhanced card surfaces with better separation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <span>Brighter primary colors for clear actions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <span>Softer white text for comfortable reading</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
