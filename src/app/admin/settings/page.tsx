'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AdminLayout from '@/components/admin-layout';
import { PageLoading } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AIConfiguration {
  id: string;
  systemPrompt: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
  topK: number;
  topP: number;
  ragSimilarityThreshold: number;
  ragMaxChunks: number;
  ragHighRelevanceThreshold: number;
  useKnowledgeBase: boolean;
  useClientMemory: boolean;
  enableWebSearch: boolean;
  createdAt: string;
  updatedAt: string;
}

// Available AI models from Google AI and OpenAI documentation
const AI_MODELS = [
  // Gemini Models
  {
    value: 'gemini-2.5-pro',
    label: 'Gemini 2.5 Pro',
    description: 'Most powerful thinking model with maximum response accuracy',
    provider: 'Google'
  },
  {
    value: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    description: 'Best price-performance with adaptive thinking',
    provider: 'Google'
  },
  {
    value: 'gemini-2.5-flash-lite-preview-06-17',
    label: 'Gemini 2.5 Flash-Lite Preview',
    description: 'Most cost-efficient model for high throughput',
    provider: 'Google'
  },
  {
    value: 'gemini-2.0-flash',
    label: 'Gemini 2.0 Flash',
    description: 'Next generation features, speed, and realtime streaming',
    provider: 'Google'
  },
  {
    value: 'gemini-2.0-flash-lite',
    label: 'Gemini 2.0 Flash-Lite',
    description: 'Cost efficiency and low latency',
    provider: 'Google'
  },
  {
    value: 'gemini-1.5-flash',
    label: 'Gemini 1.5 Flash',
    description: 'Fast and versatile performance across diverse tasks',
    provider: 'Google'
  },
  {
    value: 'gemini-1.5-flash-8b',
    label: 'Gemini 1.5 Flash-8B',
    description: 'High volume and lower intelligence tasks',
    provider: 'Google'
  },
  {
    value: 'gemini-1.5-pro',
    label: 'Gemini 1.5 Pro',
    description: 'Complex reasoning tasks requiring more intelligence',
    provider: 'Google'
  },
  
  // OpenAI Models
  {
    value: 'gpt-4o',
    label: 'GPT-4o',
    description: 'Most advanced multimodal model, faster and cheaper than GPT-4 Turbo',
    provider: 'OpenAI'
  },
  {
    value: 'gpt-4o-mini',
    label: 'GPT-4o Mini',
    description: 'Affordable and intelligent small model for fast, lightweight tasks',
    provider: 'OpenAI'
  },
  {
    value: 'gpt-4-turbo',
    label: 'GPT-4 Turbo',
    description: 'Latest GPT-4 model with improved instruction following',
    provider: 'OpenAI'
  },
  {
    value: 'gpt-4',
    label: 'GPT-4',
    description: 'Large multimodal model for complex, multi-step tasks',
    provider: 'OpenAI'
  },
  {
    value: 'gpt-3.5-turbo',
    label: 'GPT-3.5 Turbo',
    description: 'Fast, inexpensive model for simple tasks',
    provider: 'OpenAI'
  },
  {
    value: 'o1-preview',
    label: 'o1 Preview',
    description: 'Reasoning model designed to solve hard problems across domains',
    provider: 'OpenAI'
  },
  {
    value: 'o1-mini',
    label: 'o1 Mini',
    description: 'Faster and cheaper reasoning model particularly good at coding, math, and science',
    provider: 'OpenAI'
  }
];

export default function AdminSettingsPage() {
  const [config, setConfig] = useState<AIConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const fetchConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/config');
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      if (response.status === 403) {
        setError('Access denied. Admin privileges required.');
        setLoading(false);
        return;
      }
      if (!response.ok) {
        throw new Error('Failed to fetch configuration');
      }
      
      const data = await response.json();
      setConfig(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const checkAdminAccess = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      console.log('🔍 Admin page: Checking admin access for user:', user.id);

      // Fetch the configuration (this will also verify admin access)
      await fetchConfig();
    } catch {
      setError('Access denied. Admin privileges required.');
      setLoading(false);
    }
  }, [router, fetchConfig]);

  useEffect(() => {
    checkAdminAccess();
  }, [checkAdminAccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save configuration');
      }

      const result = await response.json();
      setConfig(result.config);
      setSuccess('Configuration saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (field: keyof AIConfiguration, value: string | number | boolean) => {
    if (!config) return;
    setConfig({ ...config, [field]: value });
  };

  if (loading) {
    return (
      <AdminLayout>
        <PageLoading 
          message="Loading Configuration"
          description="Preparing your admin settings panel"
        />
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md mx-auto p-6">
            <h2 className="text-xl font-semibold text-destructive mb-2">Configuration Error</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => router.push('/admin')} variant="outline">
              Return to Dashboard
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!config) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-muted-foreground">No configuration found</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">AI Configuration</h1>
            <p className="text-muted-foreground">
              Configure the AI assistant&apos;s behavior and capabilities
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>
                Manage AI model parameters and behavior
              </CardDescription>
            </CardHeader>
            <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-green-800">{success}</p>
                </div>
              )}
              
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {/* System Prompt */}
              <div className="space-y-2">
                <Label htmlFor="systemPrompt">System Prompt</Label>
                <Textarea
                  id="systemPrompt"
                  value={config.systemPrompt}
                  onChange={(e) => updateConfig('systemPrompt', e.target.value)}
                  placeholder="Enter the system prompt for the AI..."
                  rows={6}
                  className="resize-none"
                />
                <p className="text-sm text-gray-500">
                  This defines the AI&apos;s personality and instructions
                </p>
              </div>

              {/* Model Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="modelName">Model Name</Label>
                  <Select
                    value={config.modelName}
                    onValueChange={(value) => updateConfig('modelName', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a Gemini model" />
                    </SelectTrigger>
                    <SelectContent>
                      {AI_MODELS.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{model.label}</span>
                              <span className="text-xs px-1.5 py-0.5 bg-muted rounded-md">
                                {model.provider}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {model.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Choose the AI model for text generation
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxTokens">Max Tokens</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    min={1}
                    max={32768}
                    value={config.maxTokens}
                    onChange={(e) => updateConfig('maxTokens', parseInt(e.target.value))}
                  />
                </div>
              </div>

              {/* Advanced Parameters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature</Label>
                  <Input
                    id="temperature"
                    type="number"
                    min={0}
                    max={2}
                    step={0.1}
                    value={config.temperature}
                    onChange={(e) => updateConfig('temperature', parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-gray-500">0 = deterministic, 2 = creative</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="topK">Top K</Label>
                  <Input
                    id="topK"
                    type="number"
                    min={1}
                    max={100}
                    value={config.topK}
                    onChange={(e) => updateConfig('topK', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-gray-500">Token selection diversity</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="topP">Top P</Label>
                  <Input
                    id="topP"
                    type="number"
                    min={0}
                    max={1}
                    step={0.1}
                    value={config.topP}
                    onChange={(e) => updateConfig('topP', parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-gray-500">Nucleus sampling threshold</p>
                </div>
              </div>

              {/* RAG Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">RAG (Knowledge Retrieval) Settings</h3>
                <p className="text-sm text-gray-600">Configure how the AI retrieves and uses knowledge content</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ragSimilarityThreshold">Similarity Threshold</Label>
                    <Input
                      id="ragSimilarityThreshold"
                      type="number"
                      min={0.1}
                      max={1.0}
                      step={0.1}
                      value={config.ragSimilarityThreshold}
                      onChange={(e) => updateConfig('ragSimilarityThreshold', parseFloat(e.target.value))}
                    />
                    <p className="text-xs text-gray-500">Minimum relevance score (0.1-1.0)</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ragMaxChunks">Max Knowledge Chunks</Label>
                    <Input
                      id="ragMaxChunks"
                      type="number"
                      min={1}
                      max={20}
                      value={config.ragMaxChunks}
                      onChange={(e) => updateConfig('ragMaxChunks', parseInt(e.target.value))}
                    />
                    <p className="text-xs text-gray-500">Maximum pieces of knowledge to retrieve</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ragHighRelevanceThreshold">High Relevance Threshold</Label>
                    <Input
                      id="ragHighRelevanceThreshold"
                      type="number"
                      min={0.1}
                      max={1.0}
                      step={0.1}
                      value={config.ragHighRelevanceThreshold}
                      onChange={(e) => updateConfig('ragHighRelevanceThreshold', parseFloat(e.target.value))}
                    />
                    <p className="text-xs text-gray-500">Threshold for marking content as highly relevant</p>
                  </div>
                </div>
              </div>

              {/* Feature Flags */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Feature Settings</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="useKnowledgeBase"
                      checked={config.useKnowledgeBase}
                      onChange={(e) => updateConfig('useKnowledgeBase', e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="useKnowledgeBase">Use Knowledge Base</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="useClientMemory"
                      checked={config.useClientMemory}
                      onChange={(e) => updateConfig('useClientMemory', e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="useClientMemory">Use Client Memory</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="enableWebSearch"
                      checked={config.enableWebSearch}
                      onChange={(e) => updateConfig('enableWebSearch', e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="enableWebSearch">Enable Web Search</Label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Configuration'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
