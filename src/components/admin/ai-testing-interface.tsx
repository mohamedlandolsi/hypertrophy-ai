'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, CheckCircle, Play, Square, Download, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TestResult {
  prompt: string;
  response: string;
  citations: Array<{ id: string; title: string }>;
  status: 'pending' | 'success' | 'error';
  error?: string;
  timestamp: Date;
  responseTime: number;
}

// Enhanced test prompts with better coverage
const TEST_PROMPTS = [
  // Program Design
  'Give me a complete upper/lower program',
  'Give me a complete full body program',
  'Give me a complete PPL (push/pull/legs) split',
  'Give me a complete PPL x UL hybrid split',
  'Give me a complete anterior/posterior split',
  'Give me a complete upper/lower x full body hybrid program',
  'Create an Arnold split program',
  'Design a 5-day bodybuilding split',
  'Give me a minimalist 3-day program',
  
  // Muscle Group Training
  'How to effectively train chest for maximum hypertrophy',
  'How to effectively train back for width and thickness',
  'How to effectively train shoulders for all three heads',
  'How to effectively train arms (biceps and triceps)',
  'How to effectively train legs (quads, hamstrings, glutes)',
  'How to train calves effectively',
  'How to train abs and core effectively',
  
  // Specific Workouts
  'Give me an upper body workout',
  'Give me a lower body workout',
  'Give me a push workout',
  'Give me a pull workout',
  'Give me a leg workout',
  'Give me a full body workout',
  'Design a chest and triceps workout',
  'Create a back and biceps workout',
  
  // Training Goals & Methods
  'How to train for strength effectively',
  'How to train for hypertrophy effectively',
  'How to train for muscular endurance',
  'How to structure my training volume',
  'How to implement progressive overload',
  'What is the best training frequency for muscle growth',
  'How to periodize my training',
  
  // Body Composition & Nutrition
  'I want to lose fat while maintaining muscle',
  'I want to gain weight and build muscle',
  'Calculate my calorie and macro needs',
  'Recommend supplements for muscle building',
  'What supplements are essential for strength training',
  'How to eat for body recomposition',
  
  // Problem-Solving & Customization
  'I have a weak chest, how to improve it',
  'I want to focus on building bigger arms',
  'Suggest me the best training split for my goals',
  'I can only train 3 days per week',
  'I have limited equipment, what can I do',
  'I have a shoulder injury, how to train around it',
  
  // Advanced Topics
  'Does overhead extension bias the long head of triceps',
  'What is the difference between myofibrillar and sarcoplasmic hypertrophy',
  'How does training to failure affect muscle growth',
  'What is the optimal rest time between sets',
  'How many sets per muscle group per week for optimal growth',
  'What is the role of mind-muscle connection',
  
  // Specific Exercise Questions
  'What are the best compound exercises for mass',
  'How to improve my squat technique',
  'What are the best isolation exercises for arms',
  'How to target different areas of the chest',
  'What exercises build the most functional strength',
];

export function AITestingInterface() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [results, setResults] = useState<TestResult[]>([]);
  const [customPrompts, setCustomPrompts] = useState('');
  const [selectedPrompts, setSelectedPrompts] = useState<Set<number>>(new Set(Array.from({ length: TEST_PROMPTS.length }, (_, i) => i)));
  const [useCustomPrompts, setUseCustomPrompts] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  // Define categories for easier selection
  const PROMPT_CATEGORIES = {
    'Program Design': [0, 1, 2, 3, 4, 5, 6, 7, 8], // First 9 prompts
    'Muscle Group Training': [9, 10, 11, 12, 13, 14, 15], // Next 7 prompts
    'Specific Workouts': [16, 17, 18, 19, 20, 21, 22, 23], // Next 8 prompts
    'Training Goals & Methods': [24, 25, 26, 27, 28, 29, 30], // Next 7 prompts
    'Body Composition & Nutrition': [31, 32, 33, 34, 35, 36], // Next 6 prompts
    'Problem-Solving & Customization': [37, 38, 39, 40, 41, 42], // Next 6 prompts
    'Advanced Topics': [43, 44, 45, 46, 47, 48], // Next 6 prompts
    'Specific Exercise Questions': [49, 50, 51, 52, 53] // Last 5 prompts
  };

  // Helper functions for prompt selection
  const togglePromptSelection = (index: number) => {
    const newSelected = new Set(selectedPrompts);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedPrompts(newSelected);
  };

  const selectAllPrompts = () => {
    setSelectedPrompts(new Set(Array.from({ length: TEST_PROMPTS.length }, (_, i) => i)));
  };

  const deselectAllPrompts = () => {
    setSelectedPrompts(new Set());
  };

  const selectCategory = (category: string) => {
    const categoryIndices = PROMPT_CATEGORIES[category as keyof typeof PROMPT_CATEGORIES];
    const newSelected = new Set(selectedPrompts);
    categoryIndices.forEach(index => newSelected.add(index));
    setSelectedPrompts(newSelected);
  };

  const deselectCategory = (category: string) => {
    const categoryIndices = PROMPT_CATEGORIES[category as keyof typeof PROMPT_CATEGORIES];
    const newSelected = new Set(selectedPrompts);
    categoryIndices.forEach(index => newSelected.delete(index));
    setSelectedPrompts(newSelected);
  };

  const isCategorySelected = (category: string) => {
    const categoryIndices = PROMPT_CATEGORIES[category as keyof typeof PROMPT_CATEGORIES];
    return categoryIndices.every(index => selectedPrompts.has(index));
  };

  const isCategoryPartiallySelected = (category: string) => {
    const categoryIndices = PROMPT_CATEGORIES[category as keyof typeof PROMPT_CATEGORIES];
    const selectedInCategory = categoryIndices.filter(index => selectedPrompts.has(index));
    return selectedInCategory.length > 0 && selectedInCategory.length < categoryIndices.length;
  };

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);
    setCurrentPromptIndex(0);

    const promptsToTest = useCustomPrompts && customPrompts.trim() 
      ? customPrompts.split('\n').filter(p => p.trim()) 
      : TEST_PROMPTS.filter((_, index) => selectedPrompts.has(index));

    for (let i = 0; i < promptsToTest.length; i++) {
      setCurrentPromptIndex(i);
      const prompt = promptsToTest[i].trim();
      
      if (!prompt) continue;

      const startTime = Date.now();
      
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: prompt,
            conversationId: '', // Create new conversation for each test
            isGuest: false, // Ensure we're using authenticated user context
            selectedModel: 'default', // Use the default model selection
          }),
        });

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('AI Test Response:', {
          prompt,
          hasContent: !!data.content,
          citationsCount: data.citations?.length || 0,
          conversationId: data.conversationId,
          userMessageId: data.userMessage?.id,
          assistantMessageId: data.assistantMessage?.id,
          responseKeys: Object.keys(data)
        });
        
        const result: TestResult = {
          prompt,
          response: data.content || 'No response received',
          citations: data.citations || [],
          status: 'success' as const,
          timestamp: new Date(),
          responseTime,
        };

        setResults(prev => [...prev, result]);
      } catch (error) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        const result: TestResult = {
          prompt,
          response: '',
          citations: [],
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
          responseTime,
        };

        setResults(prev => [...prev, result]);
      }

      // Small delay between requests to avoid overwhelming the system
      if (i < promptsToTest.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    setIsRunning(false);
  };

  const stopTests = () => {
    setIsRunning(false);
  };

  const exportResults = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      totalTests: results.length,
      successfulTests: results.filter(r => r.status === 'success').length,
      failedTests: results.filter(r => r.status === 'error').length,
      averageResponseTime: results.reduce((acc, r) => acc + r.responseTime, 0) / results.length,
      results: results.map(r => ({
        prompt: r.prompt,
        response: r.response,
        citations: r.citations,
        status: r.status,
        error: r.error,
        responseTime: r.responseTime,
        timestamp: r.timestamp.toISOString(),
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-testing-results-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const promptsToUse = useCustomPrompts && customPrompts.trim() 
    ? customPrompts.split('\n').filter(p => p.trim()) 
    : TEST_PROMPTS.filter((_, index) => selectedPrompts.has(index));
  
  const progress = promptsToUse.length > 0 ? (currentPromptIndex / promptsToUse.length) * 100 : 0;
  const successRate = results.length > 0 ? (results.filter(r => r.status === 'success').length / results.length) * 100 : 0;
  const averageResponseTime = results.length > 0 ? results.reduce((acc, r) => acc + r.responseTime, 0) / results.length : 0;

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            AI Testing Control Panel
          </CardTitle>
          <CardDescription>
            Test AI responses across multiple prompts to evaluate performance and consistency
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={runTests}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Run All Tests ({promptsToUse.length} prompts)
            </Button>
            
            {isRunning && (
              <Button
                onClick={stopTests}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Square className="h-4 w-4" />
                Stop Testing
              </Button>
            )}
            
            {results.length > 0 && (
              <Button
                onClick={exportResults}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export Results
              </Button>
            )}
          </div>

          {isRunning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress: {currentPromptIndex} / {promptsToUse.length}</span>
                <span>{progress.toFixed(1)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                Currently testing: {promptsToUse[currentPromptIndex]}
              </p>
            </div>
          )}

          {/* Prompt Selection Mode */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="use-custom-prompts"
                checked={useCustomPrompts}
                onCheckedChange={setUseCustomPrompts}
              />
              <label htmlFor="use-custom-prompts" className="text-sm font-medium">
                Use custom prompts instead of default selection
              </label>
            </div>

            {!useCustomPrompts && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Select Default Prompts to Test</label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCategories(!showCategories)}
                    >
                      {showCategories ? 'Show All' : 'By Category'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={selectAllPrompts}
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={deselectAllPrompts}
                    >
                      Deselect All
                    </Button>
                  </div>
                </div>
                
                {showCategories ? (
                  // Category-based selection
                  <div className="max-h-60 overflow-y-auto border rounded-lg p-3 space-y-4">
                    {Object.entries(PROMPT_CATEGORIES).map(([category, indices]) => (
                      <div key={category} className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`category-${category}`}
                            checked={isCategorySelected(category)}
                            ref={(el) => {
                              if (el) {
                                el.indeterminate = isCategoryPartiallySelected(category);
                              }
                            }}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                selectCategory(category);
                              } else {
                                deselectCategory(category);
                              }
                            }}
                          />
                          <label 
                            htmlFor={`category-${category}`} 
                            className="text-sm font-medium cursor-pointer"
                          >
                            {category} ({indices.length} prompts)
                          </label>
                        </div>
                        <div className="ml-6 space-y-1">
                          {indices.map(index => (
                            <div key={index} className="flex items-start space-x-2">
                              <Checkbox
                                id={`prompt-${index}`}
                                checked={selectedPrompts.has(index)}
                                onCheckedChange={() => togglePromptSelection(index)}
                              />
                              <label 
                                htmlFor={`prompt-${index}`} 
                                className="text-xs leading-4 cursor-pointer flex-1 text-muted-foreground"
                              >
                                {TEST_PROMPTS[index]}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // All prompts list
                  <div className="max-h-60 overflow-y-auto border rounded-lg p-3 space-y-2">
                    {TEST_PROMPTS.map((prompt, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <Checkbox
                          id={`prompt-${index}`}
                          checked={selectedPrompts.has(index)}
                          onCheckedChange={() => togglePromptSelection(index)}
                        />
                        <label 
                          htmlFor={`prompt-${index}`} 
                          className="text-sm leading-5 cursor-pointer flex-1"
                        >
                          {prompt}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground">
                  {selectedPrompts.size} of {TEST_PROMPTS.length} prompts selected
                </p>
              </div>
            )}
          </div>

          {/* Custom Prompts */}
          {useCustomPrompts && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Custom Test Prompts</label>
              <Textarea
                placeholder="Enter custom prompts, one per line."
                value={customPrompts}
                onChange={(e) => setCustomPrompts(e.target.value)}
                rows={5}
              />
              <p className="text-xs text-muted-foreground">
                {customPrompts.trim() ? 
                  `${customPrompts.split('\n').filter(p => p.trim()).length} custom prompts` : 
                  `No custom prompts entered`
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{results.filter(r => r.status === 'success').length}</div>
                <div className="text-sm text-muted-foreground">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{results.filter(r => r.status === 'error').length}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{successRate.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{averageResponseTime.toFixed(0)}ms</div>
                <div className="text-sm text-muted-foreground">Avg Response Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">{results.filter(r => r.citations.length > 0).length}</div>
                <div className="text-sm text-muted-foreground">With Citations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {results.length > 0 ? (results.filter(r => r.citations.length > 0).length / results.length * 100).toFixed(1) : 0}%
                </div>
                <div className="text-sm text-muted-foreground">KB Usage Rate</div>
              </div>
            </div>
            
            {/* Knowledge Base Usage Summary */}
            {results.length > 0 && (
              <div className="mt-6 space-y-3">
                <h4 className="font-medium">Knowledge Base Usage Analysis:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <div className="font-medium text-green-800 dark:text-green-200">
                      Queries with Knowledge Base Citations: {results.filter(r => r.citations.length > 0).length}
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-300 mt-1">
                      These responses used the RAG system and cited relevant knowledge base sources
                    </div>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                    <div className="font-medium text-amber-800 dark:text-amber-200">
                      Queries without Citations: {results.filter(r => r.citations.length === 0).length}
                    </div>
                    <div className="text-sm text-amber-600 dark:text-amber-300 mt-1">
                      These responses may have used general knowledge or didn&apos;t match knowledge base content
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Review AI responses for quality, accuracy, and consistency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {results.map((result, index) => (
                  <Card key={index} className="border-l-4 border-l-gray-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          {result.status === 'success' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                          Test #{index + 1}
                          <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                            {result.status}
                          </Badge>
                        </CardTitle>
                        <div className="text-sm text-muted-foreground">
                          {result.responseTime}ms
                        </div>
                      </div>
                      <div className="text-sm font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                        <strong>Prompt:</strong> {result.prompt}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {result.status === 'error' ? (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Error:</strong> {result.error}
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <h4 className="font-medium">AI Response:</h4>
                            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-sm whitespace-pre-wrap">
                              {result.response}
                            </div>
                          </div>
                          
                          {result.citations.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="font-medium flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                Knowledge Base Sources ({result.citations.length}):
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {result.citations.map((citation, citIndex) => (
                                  <Badge key={citIndex} variant="outline" className="text-xs">
                                    {citation.title}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {result.citations.length === 0 && (
                            <div className="space-y-2">
                              <h4 className="font-medium flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-amber-600" />
                                Knowledge Base Usage:
                              </h4>
                              <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg text-sm">
                                No knowledge base sources were cited for this response. This could indicate:
                                <ul className="mt-2 ml-4 list-disc space-y-1">
                                  <li>The query didn&apos;t match any knowledge base content</li>
                                  <li>The AI used general knowledge instead of the knowledge base</li>
                                  <li>The RAG system may need adjustment for this type of query</li>
                                </ul>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      
                      <div className="text-xs text-muted-foreground">
                        {result.timestamp.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Default Prompts Preview */}
      {!customPrompts.trim() && (
        <Card>
          <CardHeader>
            <CardTitle>Default Test Prompts ({TEST_PROMPTS.length})</CardTitle>
            <CardDescription>
              These prompts will be used if no custom prompts are provided
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-60">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {TEST_PROMPTS.map((prompt, index) => (
                  <div key={index} className="text-sm p-2 bg-gray-50 dark:bg-gray-900 rounded">
                    {index + 1}. {prompt}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
