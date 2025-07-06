'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Loading, 
  FullPageLoading, 
  InlineLoading, 
  ButtonLoading, 
  ChatLoading, 
  AuthLoading,
  CardSkeleton,
  ListSkeleton,
  TableSkeleton 
} from '@/components/ui/loading';

export default function LoadingDemo() {
  const [currentDemo, setCurrentDemo] = useState<string | null>(null);

  const loadingVariants = [
    { name: 'Default', variant: 'default' as const },
    { name: 'Pulse', variant: 'pulse' as const },
    { name: 'Dots', variant: 'dots' as const },
    { name: 'Bars', variant: 'bars' as const },
    { name: 'Fitness', variant: 'fitness' as const },
    { name: 'Brain', variant: 'brain' as const },
  ];

  const loadingSizes = [
    { name: 'Small', size: 'sm' as const },
    { name: 'Medium', size: 'md' as const },
    { name: 'Large', size: 'lg' as const },
    { name: 'X-Large', size: 'xl' as const },
  ];

  if (currentDemo === 'fullpage') {
    return (
      <div className="relative">
        <Button 
          onClick={() => setCurrentDemo(null)}
          className="absolute top-4 left-4 z-10"
          variant="outline"
        >
          Back to Demo
        </Button>
        <FullPageLoading 
          variant="fitness"
          message="Full Page Loading Demo"
          description="This is how a full page loading screen looks"
        />
      </div>
    );
  }

  if (currentDemo === 'auth') {
    return (
      <div className="relative">
        <Button 
          onClick={() => setCurrentDemo(null)}
          className="absolute top-4 left-4 z-10"
          variant="outline"
        >
          Back to Demo
        </Button>
        <AuthLoading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Enhanced Loading Components</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A comprehensive collection of modern, accessible loading indicators and skeleton screens 
            designed for the Hypertrophy AI application.
          </p>
        </div>

        {/* Basic Loading Variants */}
        <Card>
          <CardHeader>
            <CardTitle>Loading Variants</CardTitle>
            <CardDescription>Different animation styles for various contexts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {loadingVariants.map((variant) => (
                <div key={variant.name} className="text-center space-y-3">
                  <h3 className="font-medium">{variant.name}</h3>
                  <div className="h-20 flex items-center justify-center border rounded-lg bg-muted/30">
                    <Loading 
                      variant={variant.variant} 
                      size="md"
                      message="Loading..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Loading Sizes */}
        <Card>
          <CardHeader>
            <CardTitle>Loading Sizes</CardTitle>
            <CardDescription>Different sizes for different UI contexts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {loadingSizes.map((size) => (
                <div key={size.name} className="text-center space-y-3">
                  <h3 className="font-medium">{size.name}</h3>
                  <div className="h-20 flex items-center justify-center border rounded-lg bg-muted/30">
                    <Loading 
                      variant="default" 
                      size={size.size}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Inline Loading Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Inline Loading</CardTitle>
            <CardDescription>Loading indicators that work inline with content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <span>Processing your workout:</span>
              <InlineLoading variant="pulse" />
            </div>
            <div className="flex items-center space-x-4">
              <span>AI is thinking:</span>
              <InlineLoading variant="dots" message="Analyzing..." />
            </div>
            <div className="flex items-center space-x-4">
              <span>Upload progress:</span>
              <InlineLoading variant="bars" />
            </div>
          </CardContent>
        </Card>

        {/* Button Loading States */}
        <Card>
          <CardHeader>
            <CardTitle>Button Loading States</CardTitle>
            <CardDescription>Loading indicators for interactive elements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button disabled>
                <ButtonLoading size="sm" className="mr-2" />
                Uploading...
              </Button>
              <Button disabled variant="outline">
                <ButtonLoading size="sm" className="mr-2" />
                Processing
              </Button>
              <Button disabled variant="secondary">
                <ButtonLoading size="sm" className="mr-2" />
                Saving Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Context-Specific Loading */}
        <Card>
          <CardHeader>
            <CardTitle>Context-Specific Loading</CardTitle>
            <CardDescription>Specialized loading screens for different app sections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-6 bg-muted/30">
                <h3 className="font-medium mb-4">Knowledge Base Loading</h3>
                <div className="h-32 flex items-center justify-center">
                  <Loading variant="brain" size="lg" message="Processing Knowledge" />
                </div>
              </div>
              <div className="border rounded-lg p-6 bg-muted/30">
                <h3 className="font-medium mb-4">Fitness Data Loading</h3>
                <div className="h-32 flex items-center justify-center">
                  <Loading variant="fitness" size="lg" message="Analyzing Workouts" />
                </div>
              </div>
              <div className="border rounded-lg p-6 bg-muted/30">
                <h3 className="font-medium mb-4">Chat Loading</h3>
                <div className="h-32 flex items-center justify-center">
                  <ChatLoading />
                </div>
              </div>
              <div className="border rounded-lg p-6 bg-muted/30">
                <h3 className="font-medium mb-4">Page Loading</h3>
                <div className="h-32 flex items-center justify-center">
                  <Loading variant="pulse" size="md" message="Loading Dashboard" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Full Page Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Full Page Loading Examples</CardTitle>
            <CardDescription>Complete loading experiences for page transitions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={() => setCurrentDemo('fullpage')}
                variant="outline"
                className="h-20"
              >
                View Full Page Loading
              </Button>
              <Button 
                onClick={() => setCurrentDemo('auth')}
                variant="outline"
                className="h-20"
              >
                View Auth Loading
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Skeleton Loading */}
        <Card>
          <CardHeader>
            <CardTitle>Skeleton Loading</CardTitle>
            <CardDescription>Placeholder content while data loads</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-medium mb-3">Card Skeleton</h3>
              <CardSkeleton />
            </div>
            <div>
              <h3 className="font-medium mb-3">List Skeleton</h3>
              <ListSkeleton items={3} />
            </div>
            <div>
              <h3 className="font-medium mb-3">Table Skeleton</h3>
              <TableSkeleton rows={4} cols={3} />
            </div>
          </CardContent>
        </Card>

        {/* Implementation Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Implementation Examples</CardTitle>
            <CardDescription>Code examples for using these components</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div className="bg-muted p-4 rounded-lg">
                <code>{`<Loading variant="fitness" size="lg" message="Processing..." />`}</code>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <code>{`<InlineLoading variant="dots" message="AI thinking..." />`}</code>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <code>{`<FullPageLoading variant="brain" message="Loading App" />`}</code>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <code>{`<KnowledgeLoading /> // Context-specific component`}</code>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
