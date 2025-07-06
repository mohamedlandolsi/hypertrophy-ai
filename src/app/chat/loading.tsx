import { Loading } from '@/components/ui/loading';

export default function ChatLoadingPage() {
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-muted rounded-md animate-pulse" />
          <div className="w-32 h-6 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
          <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Skeleton */}
        <div className="hidden md:flex md:w-80 border-r border-border bg-muted/30">
          <div className="flex-1 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-24 h-6 bg-muted rounded animate-pulse" />
              <div className="w-6 h-6 bg-muted rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-3 p-3 rounded-lg border border-border bg-card">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <div className="flex-1 space-y-1">
                    <div className="w-3/4 h-4 bg-muted rounded animate-pulse" />
                    <div className="w-1/2 h-3 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Messages Area */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {/* Welcome Message Skeleton */}
            <div className="flex justify-center mb-8">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-primary/20 rounded-full animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="w-48 h-6 bg-muted rounded animate-pulse mx-auto" />
                  <div className="w-64 h-4 bg-muted rounded animate-pulse mx-auto" />
                </div>
              </div>
            </div>

            {/* Sample Message Skeletons */}
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-4">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="max-w-xs lg:max-w-md xl:max-w-lg">
                    <div className="bg-primary/10 rounded-lg p-3 space-y-2">
                      <div className="w-32 h-4 bg-muted rounded animate-pulse" />
                      <div className="w-24 h-4 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                </div>

                {/* AI Message */}
                <div className="flex justify-start">
                  <div className="max-w-xs lg:max-w-md xl:max-w-lg">
                    <div className="bg-card border border-border rounded-lg p-3 space-y-2">
                      <div className="w-full h-4 bg-muted rounded animate-pulse" />
                      <div className="w-5/6 h-4 bg-muted rounded animate-pulse" />
                      <div className="w-4/6 h-4 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Input Area Skeleton */}
          <div className="p-4 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-end space-x-3">
              <div className="flex-1 space-y-2">
                <div className="w-full h-10 bg-muted rounded-lg animate-pulse" />
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-muted rounded animate-pulse" />
                  <div className="w-20 h-3 bg-muted rounded animate-pulse" />
                </div>
              </div>
              <div className="w-10 h-10 bg-primary/20 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Animated Loading Indicator */}
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-card border border-border rounded-lg p-8 shadow-lg max-w-sm w-full mx-4">
          <div className="text-center space-y-6">
            <Loading 
              variant="brain"
              size="lg" 
              message="Initializing AI Coach" 
              description="Setting up your personalized fitness experience..."
            />
            
            {/* Progress Steps */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <div className="text-sm text-muted-foreground">Loading conversation history...</div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-150" />
                <div className="text-sm text-muted-foreground">Connecting to AI models...</div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-300" />
                <div className="text-sm text-muted-foreground">Preparing knowledge base...</div>
              </div>
            </div>
            
            {/* Fitness-themed animation */}
            <div className="flex justify-center space-x-2">
              <div className="w-3 h-3 bg-primary rounded-full animate-bounce" />
              <div className="w-3 h-3 bg-primary rounded-full animate-bounce delay-150" />
              <div className="w-3 h-3 bg-primary rounded-full animate-bounce delay-300" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
