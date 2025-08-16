// src/lib/gemini-utils.ts
// Utility functions for enhanced Gemini AI operations
/* eslint-disable @typescript-eslint/no-unused-vars */

import { KnowledgeContext } from './vector-search';

/**
 * Generate a conflict confirmation prompt for the user
 */
export function generateConflictConfirmationPrompt(
  conflictData: Record<string, unknown>
): string {
  const { conflictType, currentValue, newValue, field } = conflictData;
  
  let prompt = `⚠️ **Conflict Detected**: I noticed some conflicting information about your ${field}.`;
  
  if (currentValue && newValue) {
    prompt += `\n\n**Current information**: ${currentValue}`;
    prompt += `\n**New information**: ${newValue}`;
  }
  
  prompt += `\n\nWhich information is correct? Please confirm so I can update your profile accurately.`;
  
  return prompt;
}

/**
 * Extract available exercises from knowledge base for validation
 */
export function extractKnowledgeBaseExercises(knowledgeContext: KnowledgeContext[]): Set<string> {
  const exercises = new Set<string>();
  
  const exercisePatterns = [
    /\b(?:squat|deadlift|bench press|row|pull-up|push-up|lunge|curl|press|extension|fly|raise)\b/gi,
    /\b(?:barbell|dumbbell|cable|machine|bodyweight)\s+\w+/gi,
    /\b\w+\s+(?:squat|deadlift|press|row|curl|extension|fly|raise)\b/gi
  ];
  
  for (const chunk of knowledgeContext) {
    for (const pattern of exercisePatterns) {
      const matches = chunk.content.match(pattern);
      if (matches) {
        matches.forEach(match => exercises.add(match.toLowerCase().trim()));
      }
    }
  }
  
  return exercises;
}

/**
 * Calculate content priority scores for token optimization
 */
export function calculateContentPriority(content: string, type: 'system' | 'context' | 'history'): number {
  const priorities = {
    system: 10,
    context: 8,
    history: 5
  };
  
  let score = priorities[type];
  
  // Boost priority for core directives
  if (type === 'system' && content.includes('CORE COACHING DIRECTIVES')) {
    score += 5;
  }
  
  // Boost priority for user profile/memory
  if (type === 'context' && (content.includes('user_profile') || content.includes('long_term_memory'))) {
    score += 3;
  }
  
  // Boost priority for recent history
  if (type === 'history') {
    score += 2; // More recent messages get higher priority
  }
  
  return score;
}

/**
 * Validate system prompt structure for optimal performance
 */
export function validateSystemPromptStructure(systemPrompt: string): {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
} {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  
  // Check for core directives marker
  if (!systemPrompt.includes('CORE COACHING DIRECTIVES')) {
    warnings.push('Missing CORE COACHING DIRECTIVES marker - may affect token prioritization');
    suggestions.push('Add ### CORE COACHING DIRECTIVES ### section for optimal token management');
  }
  
  // Check prompt length
  const promptLength = systemPrompt.length;
  if (promptLength > 8000) {
    warnings.push(`System prompt is ${promptLength} characters - may be truncated with large knowledge base`);
    suggestions.push('Consider splitting into core directives (always preserved) and supplementary content');
  }
  
  // Check for knowledge base instructions
  if (!systemPrompt.includes('knowledge_base_context')) {
    warnings.push('Missing knowledge base context instructions');
    suggestions.push('Add specific instructions for handling <knowledge_base_context> sections');
  }
  
  // Check for exercise compliance instructions
  if (!systemPrompt.toLowerCase().includes('only suggest exercises') && !systemPrompt.toLowerCase().includes('knowledge base')) {
    warnings.push('Missing exercise compliance instructions');
    suggestions.push('Add strict instructions to only suggest exercises from knowledge base');
  }
  
  return {
    isValid: warnings.length === 0,
    warnings,
    suggestions
  };
}

/**
 * Generate debug information for troubleshooting
 */
export function generateDebugInfo(
  tokenBudget: { systemPrompt: number; context: number; history: number; remaining: number },
  actualTokens: { system: number; context: number; history: number },
  knowledgeChunks: number,
  modelName: string
): string {
  return `
🔍 **Debug Information**
├── Model: ${modelName}
├── Token Budget: ${tokenBudget.systemPrompt + tokenBudget.context + tokenBudget.history}
│   ├── System: ${tokenBudget.systemPrompt} (used: ${actualTokens.system})
│   ├── Context: ${tokenBudget.context} (used: ${actualTokens.context})
│   └── History: ${tokenBudget.history} (used: ${actualTokens.history})
├── Knowledge Chunks: ${knowledgeChunks}
└── Budget Utilization: ${((actualTokens.system + actualTokens.context + actualTokens.history) / (tokenBudget.systemPrompt + tokenBudget.context + tokenBudget.history) * 100).toFixed(1)}%
  `.trim();
}
