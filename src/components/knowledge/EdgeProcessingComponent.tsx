'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Clock, Cpu, FileText, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface EdgeProcessingComponentProps {
  knowledgeItemId: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  onProcessingComplete?: (result: ProcessingResult) => void;
}

interface ProcessingResult {
  knowledgeItemId: string;
  fileName: string;
  chunksCreated: number;
  embeddingsGenerated: number;
  processingTime: number;
  success: boolean;
}

interface ProcessingStatus {
  status: 'PROCESSING' | 'READY' | 'ERROR';
  totalChunks: number;
  chunksWithEmbeddings: number;
  processingComplete: boolean;
}

export function EdgeProcessingComponent({
  knowledgeItemId,
  fileName,
  filePath,
  mimeType,
  onProcessingComplete
}: EdgeProcessingComponentProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startEdgeProcessing = async () => {
    setIsProcessing(true);
    setError(null);
    setProgress(10);

    try {
      toast.info('Starting Edge Function processing...', {
        description: `Processing ${fileName} with Supabase Edge Function`,
      });

      const response = await fetch('/api/knowledge/process-with-edge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filePath,
          fileName,
          mimeType,
          knowledgeItemId,
        }),
      });

      setProgress(50);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Edge Function processing failed');
      }

      const result = await response.json();
      setResult(result.result);
      setProgress(100);

      toast.success('Edge Function processing completed!', {
        description: `Created ${result.result.chunksCreated} chunks with ${result.result.embeddingsGenerated} embeddings`,
      });

      // Poll for final status
      await pollProcessingStatus();

      if (onProcessingComplete) {
        onProcessingComplete(result);
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Edge processing error:', error);
      setError(errorMessage);
      setProgress(0);
      
      toast.error('Edge Function processing failed', {
        description: errorMessage,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const pollProcessingStatus = async () => {
    try {
      const response = await fetch(`/api/knowledge/process-with-edge?id=${knowledgeItemId}`);
      if (response.ok) {
        const status = await response.json();
        setProcessingStatus(status);
      }
    } catch (error) {
      console.warn('Failed to fetch processing status:', error);
    }
  };

  const getStatusBadge = () => {
    if (!processingStatus) return null;

    switch (processingStatus.status) {
      case 'PROCESSING':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Processing
          </Badge>
        );
      case 'READY':
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-500">
            <CheckCircle2 className="w-3 h-3" />
            Complete
          </Badge>
        );
      case 'ERROR':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Error
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-500" />
              Edge Function Processing
            </CardTitle>
            <CardDescription>
              Process documents using Supabase Edge Functions with transformers.js
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="w-4 h-4" />
          <span className="font-medium">{fileName}</span>
          <span>({mimeType})</span>
        </div>

        {isProcessing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Processing with Edge Function...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {result && (
          <div className="space-y-3 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle2 className="w-4 h-4" />
              <span className="font-medium">Processing Completed</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Chunks Created</div>
                <div className="font-medium">{result.chunksCreated}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Embeddings Generated</div>
                <div className="font-medium">{result.embeddingsGenerated}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Processing Time</div>
                <div className="font-medium">{result.processingTime}ms</div>
              </div>
              <div>
                <div className="text-muted-foreground">Success Rate</div>
                <div className="font-medium">
                  {result.chunksCreated > 0 
                    ? Math.round((result.embeddingsGenerated / result.chunksCreated) * 100)
                    : 0}%
                </div>
              </div>
            </div>
          </div>
        )}

        {processingStatus && (
          <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Cpu className="w-4 h-4" />
              <span className="font-medium">Current Status</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Total Chunks</div>
                <div className="font-medium">{processingStatus.totalChunks}</div>
              </div>
              <div>
                <div className="text-muted-foreground">With Embeddings</div>
                <div className="font-medium">{processingStatus.chunksWithEmbeddings}</div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300 mb-2">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">Processing Failed</span>
            </div>
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={startEdgeProcessing}
            disabled={isProcessing}
            className="flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Process with Edge Function
              </>
            )}
          </Button>

          <Button 
            variant="outline"
            onClick={pollProcessingStatus}
            disabled={isProcessing}
            className="flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            Check Status
          </Button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Uses Supabase Edge Functions for serverless processing</p>
          <p>• Generates embeddings using transformers.js (all-MiniLM-L6-v2)</p>
          <p>• Supports text, PDF, and JSON file formats</p>
          <p>• Processes files with semantic chunking and batch embedding generation</p>
        </div>
      </CardContent>
    </Card>
  );
}
