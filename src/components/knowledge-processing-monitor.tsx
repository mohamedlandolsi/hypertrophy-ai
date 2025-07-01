/**
 * Knowledge Processing Monitor Component
 * 
 * Displays the status of knowledge item processing including
 * chunking and embedding generation statistics
 */

'use client';

import { useState, useEffect } from 'react';
import { showToast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ProcessingStats {
  totalItems: number;
  itemsWithChunks: number;
  needsReprocessing: number;
  processingItems: number;
  errorItems: number;
  itemsWithoutFiles: number;
}

interface ReprocessingStatus {
  statistics: ProcessingStats;
  canReprocess: boolean;
}

interface ReprocessingResult {
  message: string;
  summary: {
    totalFound: number;
    processed: number;
    skipped: number;
    successfulProcessing: number;
  };
  processed: Array<{
    id: string;
    title: string;
    success: boolean;
    chunksCreated: number;
    embeddingsGenerated: number;
    processingTime: number;
    warnings: string[];
    errors: string[];
  }>;
  skipped?: Array<{
    id: string;
    title: string;
    reason: string;
  }>;
}

export default function KnowledgeProcessingMonitor() {
  const [status, setStatus] = useState<ReprocessingStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [reprocessing, setReprocessing] = useState(false);
  const [lastResult, setLastResult] = useState<ReprocessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load status on component mount
  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/knowledge/reprocess');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      console.error('Failed to load processing status:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load status';
      setError(errorMessage);
      showToast.error('Failed to load processing status', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const runReprocessing = async (options: { limit?: number; forceReprocess?: boolean } = {}) => {
    const loadingToast = showToast.processing(
      'Processing knowledge items', 
      `${options.forceReprocess ? 'Reprocessing' : 'Processing'} up to ${options.limit || 10} items...`
    );

    try {
      setReprocessing(true);
      setError(null);
      setLastResult(null);

      const response = await fetch('/api/knowledge/reprocess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          limit: options.limit || 10,
          forceReprocess: options.forceReprocess || false
        })
      });

      showToast.dismiss(loadingToast);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setLastResult(result);
      
      // Show result toast
      if (result.summary) {
        showToast.reprocessingComplete(result.summary.successfulProcessing, result.summary.totalFound);
      }
      
      // Reload status after reprocessing
      await loadStatus();
      
    } catch (err) {
      console.error('Failed to run reprocessing:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to reprocess';
      setError(errorMessage);
      showToast.dismiss(loadingToast);
      showToast.error('Reprocessing failed', errorMessage);
    } finally {
      setReprocessing(false);
    }
  };

  if (loading && !status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Knowledge Processing Status</CardTitle>
          <CardDescription>Loading processing statistics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Knowledge Processing Status</CardTitle>
          <CardDescription>
            Monitor the chunking and embedding generation status for your knowledge items
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
              Error: {error}
            </div>
          )}

          {status && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 rounded-lg">
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{status.statistics.totalItems}</div>
                <div className="text-sm text-blue-600 dark:text-blue-400">Total Files</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/30 rounded-lg">
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">{status.statistics.itemsWithChunks}</div>
                <div className="text-sm text-green-600 dark:text-green-400">Processed</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800/30 rounded-lg">
                <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{status.statistics.needsReprocessing}</div>
                <div className="text-sm text-yellow-600 dark:text-yellow-400">Need Processing</div>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/30 rounded-lg">
                <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">{status.statistics.processingItems}</div>
                <div className="text-sm text-orange-600 dark:text-orange-400">Processing</div>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-lg">
                <div className="text-2xl font-bold text-red-700 dark:text-red-300">{status.statistics.errorItems}</div>
                <div className="text-sm text-red-600 dark:text-red-400">Errors</div>
              </div>
              <div className="text-center p-4 bg-muted/50 border border-border rounded-lg">
                <div className="text-2xl font-bold text-muted-foreground">{status.statistics.itemsWithoutFiles}</div>
                <div className="text-sm text-muted-foreground">No File</div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button 
              onClick={() => loadStatus()} 
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Refreshing...' : 'Refresh Status'}
            </Button>
            
            {status?.canReprocess && (
              <>
                <Button
                  onClick={() => runReprocessing({ limit: 10 })}
                  disabled={reprocessing}
                >
                  {reprocessing ? 'Processing...' : 'Process Missing (10)'}
                </Button>
                <Button
                  onClick={() => runReprocessing({ limit: 5, forceReprocess: true })}
                  disabled={reprocessing}
                  variant="secondary"
                >
                  {reprocessing ? 'Processing...' : 'Reprocess All (5)'}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Last Processing Result */}
      {lastResult && (
        <Card>
          <CardHeader>
            <CardTitle>Last Processing Result</CardTitle>
            <CardDescription>{lastResult.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 rounded">
                <div className="text-lg font-semibold text-blue-700 dark:text-blue-300">{lastResult.summary.totalFound}</div>
                <div className="text-xs text-blue-600 dark:text-blue-400">Found</div>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/30 rounded">
                <div className="text-lg font-semibold text-green-700 dark:text-green-300">{lastResult.summary.successfulProcessing}</div>
                <div className="text-xs text-green-600 dark:text-green-400">Successful</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800/30 rounded">
                <div className="text-lg font-semibold text-yellow-700 dark:text-yellow-300">{lastResult.summary.processed}</div>
                <div className="text-xs text-yellow-600 dark:text-yellow-400">Processed</div>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded">
                <div className="text-lg font-semibold text-red-700 dark:text-red-300">{lastResult.summary.skipped}</div>
                <div className="text-xs text-red-600 dark:text-red-400">Skipped</div>
              </div>
            </div>

            {lastResult.processed.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Processing Details:</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {lastResult.processed.map((item) => (
                    <div 
                      key={item.id} 
                      className={`p-3 rounded text-sm border ${
                        item.success 
                          ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800/30' 
                          : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/30'
                      }`}
                    >
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {item.success ? (
                          `✅ ${item.chunksCreated} chunks, ${item.embeddingsGenerated} embeddings (${item.processingTime}ms)`
                        ) : (
                          `❌ ${item.errors.join(', ')}`
                        )}
                      </div>
                      {item.warnings.length > 0 && (
                        <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                          ⚠️ {item.warnings.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lastResult.skipped && lastResult.skipped.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Skipped Items:</h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {lastResult.skipped.map((item) => (
                    <div key={item.id} className="text-sm text-red-600 dark:text-red-400">
                      {item.title}: {item.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
