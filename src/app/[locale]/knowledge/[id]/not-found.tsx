import { Button } from "@/components/ui/button";
import { ArrowLeft, FileX } from "lucide-react";
import Link from "next/link";

export default function KnowledgeNotFound() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header with back button */}
        <div className="mb-6">
          <Link href="/chat">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Chat
            </Button>
          </Link>
        </div>

        {/* Not found content */}
        <div className="bg-card rounded-lg border p-8 text-center">
          <FileX className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            The article you&apos;re looking for doesn&apos;t exist or may have been removed. 
            Please check the link or return to the chat.
          </p>
          <Link href="/chat">
            <Button>
              Return to Chat
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
