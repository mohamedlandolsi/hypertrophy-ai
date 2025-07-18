import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ClientOnlyHtmlRenderer from '@/components/ui/client-only-html-renderer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, FileText } from 'lucide-react';
import Link from 'next/link';

interface KnowledgePageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getKnowledgeItem(id: string) {
  try {
    const knowledgeItem = await prisma.knowledgeItem.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
        createdAt: true,
        updatedAt: true,
        fileName: true,
        mimeType: true,
        status: true,
      },
    });

    return knowledgeItem;
  } catch (error) {
    console.error('Error fetching knowledge item:', error);
    return null;
  }
}

export default async function KnowledgePage({ params }: KnowledgePageProps) {
  const resolvedParams = await params;
  const knowledgeItem = await getKnowledgeItem(resolvedParams.id);

  if (!knowledgeItem) {
    notFound();
  }

  // If the item is still processing, show a message
  if (knowledgeItem.status === 'PROCESSING') {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-6">
            <Link href="/chat">
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Chat
              </Button>
            </Link>
          </div>
          
          <div className="bg-card rounded-lg border p-8 text-center">
            <div className="animate-pulse">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h1 className="text-2xl font-bold mb-2">{knowledgeItem.title}</h1>
              <p className="text-muted-foreground">
                This article is still being processed. Please check back later.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

        {/* Article header */}
        <div className="bg-card rounded-lg border p-6 mb-6">
          <h1 className="text-3xl font-bold mb-4 text-foreground">
            {knowledgeItem.title}
          </h1>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                {new Date(knowledgeItem.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            
            {knowledgeItem.fileName && (
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>{knowledgeItem.fileName}</span>
              </div>
            )}
            
            <div className="flex items-center gap-1">
              <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                {knowledgeItem.type.toLowerCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Article content */}
        <div className="bg-card rounded-lg border overflow-hidden">
          {knowledgeItem.content ? (
            <div className="max-w-none">
              <ClientOnlyHtmlRenderer 
                content={knowledgeItem.content}
                className="text-foreground"
              />
            </div>
          ) : (
            <div className="text-center py-12 px-6">
              <FileText className="h-16 w-16 mx-auto mb-6 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2 text-foreground">No Content Available</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                This article doesn&apos;t have any content yet, or it may still be processing.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Generate metadata for the page
export async function generateMetadata({ params }: KnowledgePageProps) {
  const resolvedParams = await params;
  const knowledgeItem = await getKnowledgeItem(resolvedParams.id);
  
  if (!knowledgeItem) {
    return {
      title: 'Article Not Found',
    };
  }

  return {
    title: knowledgeItem.title,
    description: knowledgeItem.content 
      ? `${knowledgeItem.content.substring(0, 160)}...`
      : 'View this knowledge base article',
  };
}
