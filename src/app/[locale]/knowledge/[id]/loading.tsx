import { Loading } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function KnowledgeLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header with back button */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" className="mb-4" disabled>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Chat
          </Button>
        </div>

        {/* Loading state */}
        <div className="bg-card rounded-lg border p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loading 
              variant="brain" 
              size="lg" 
              message="Loading article..." 
              description="Please wait while we fetch the content"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
