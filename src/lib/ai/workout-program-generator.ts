/**
 * CORRECTED WORKOUT PROGRAM GENERATOR
 * Integrating set volume logic with clean implementation
 */

// src/lib/ai/workout-program-generator.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getContextQASystemPrompt } from './core-prompts';
import { getEnhancedKnowledgeContext } from '../gemini';
import { getAIConfiguration } from '../gemini';

// Initialize Gemini client
if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Map UI model selection to actual Gemini model names
 */
function getGeminiModelName(selectedModel?: string, config?: Record<string, unknown>): string {
  const modelMap: Record<string, string> = {
    'flash': 'gemini-2.5-flash',
    'pro': 'gemini-2.5-pro'
  };
  
  if (selectedModel && modelMap[selectedModel]) {
    console.log(`🎯 Workout program using selected model: ${selectedModel} → ${modelMap[selectedModel]}`);
    return modelMap[selectedModel];
  }
  
  const fallbackModel = (config?.proModelName as string) || 'gemini-2.5-pro';
  console.log(`🔄 Workout program using fallback model: ${fallbackModel}`);
  return fallbackModel;
}

interface WorkoutProgramContext {
  query: string;
  chunks: Array<{
    id: string;
    title: string;
    content: string;
    score: number;
  }>;
}

/**
 * Detect workout program generation intent in user prompt
 */
export function detectWorkoutProgramIntent(prompt: string): boolean {
  const lowerPrompt = prompt.toLowerCase();
  const programKeywords = [
    'create a program', 'create program', 'workout program', 'training program',
    'workout plan', 'training plan', 'routine', 'schedule me a workout',
    'schedule workout', 'design a program', 'design program', 'build a program',
    'build program', 'workout routine', 'training routine', 'full program',
    'weekly plan', 'split routine', 'training split', 'program for me',
    'workout schedule'
  ];
  
  const hasExactMatch = programKeywords.some(keyword => lowerPrompt.includes(keyword));
  
  const patternMatches = [
    /create.*\d.*day.*workout/i,
    /create.*\d.*day.*program/i,
    /design.*\d.*day.*workout/i,
    /\d.*day.*workout.*program/i,
    /\d.*day.*training.*program/i,
    /program.*\d.*day/i,
    /workout.*\d.*day/i
  ];
  
  const hasPatternMatch = patternMatches.some(pattern => pattern.test(prompt));
  
  return hasExactMatch || hasPatternMatch;
}

/**
 * Detect program/workout review intent in user prompt
 */
export function detectProgramReviewIntent(prompt: string): boolean {
  const lowerPrompt = prompt.toLowerCase();
  
  const reviewKeywords = [
    'review my program', 'review my workout', 'review my routine',
    'check my program', 'check my workout', 'check my routine',
    'evaluate my program', 'evaluate my workout', 'evaluate my routine',
    'analyze my program', 'analyze my workout', 'analyze my routine',
    'feedback on my program', 'feedback on my workout', 'feedback on my routine',
    'what do you think of my program', 'what do you think of my workout',
    'rate my program', 'rate my workout', 'critique my program'
  ];
  
  const hasExactMatch = reviewKeywords.some(keyword => lowerPrompt.includes(keyword));
  
  const reviewPatterns = [
    /here.*is.*my.*program/i, /here.*is.*my.*workout/i,
    /this.*is.*my.*program/i, /this.*is.*my.*workout/i,
    /my.*current.*program/i, /my.*current.*workout/i,
    /is.*this.*program.*good/i, /is.*this.*workout.*good/i
  ];
  
  const hasPatternMatch = reviewPatterns.some(pattern => pattern.test(prompt));
  const hasWorkoutStructure = checkForWorkoutStructure(prompt);
  
  return hasExactMatch || hasPatternMatch || hasWorkoutStructure;
}

/**
 * Check if the prompt contains structured workout data
 */
function checkForWorkoutStructure(prompt: string): boolean {
  const exercisePatterns = [
    /\d+\s*x\s*\d+/g,
    /\d+\s*sets?\s*of\s*\d+/gi,
    /\d+\s*reps?/gi,
    /\d+\s*sets?/gi,
  ];
  
  let exerciseIndicators = 0;
  exercisePatterns.forEach(pattern => {
    const matches = prompt.match(pattern);
    if (matches) exerciseIndicators += matches.length;
  });
  
  const commonExercises = [
    'squat', 'deadlift', 'bench press', 'row', 'pull up', 'pullup',
    'curl', 'extension', 'raise', 'press', 'fly', 'dip', 'lunge'
  ];
  
  const exerciseCount = commonExercises.filter(exercise => 
    prompt.toLowerCase().includes(exercise)
  ).length;
  
  return exerciseIndicators >= 3 && exerciseCount >= 2;
}

/**
 * Extract mentioned muscle groups from user prompt
 */
function extractMuscleGroups(prompt: string): string[] {
  const lowerPrompt = prompt.toLowerCase();
  const muscleGroups = [
    'chest', 'pectorals', 'pecs', 'biceps', 'bicep', 'arms',
    'triceps', 'tricep', 'shoulders', 'delts', 'deltoids',
    'back', 'lats', 'latissimus', 'rhomboids', 'traps', 'trapezius',
    'legs', 'quads', 'quadriceps', 'hamstrings', 'glutes', 'calves',
    'abs', 'core', 'abdominals', 'forearms', 'forearm'
  ];
  
  return muscleGroups.filter(muscle => lowerPrompt.includes(muscle));
}

/**
 * Define core training principles needed for comprehensive program design
 * Now returns the entire hypertrophy_programs category content
 */
function getCoreTrainingPrinciples(): string[] {
  return [
    'hypertrophy_programs'  // Return entire hypertrophy_programs category
  ];
}

/**
 * Generate muscle-specific search queries using KB categories
 */
function getMuscleSpecificQueries(mentionedMuscles: string[]): string[] {
  const muscleQueries: string[] = [];
  
  const muscleMapping: Record<string, string[]> = {
    'chest': ['chest'],
    'pectorals': ['chest'],
    'pecs': ['chest'],
    'biceps': ['elbow_flexors'],
    'bicep': ['elbow_flexors'],
    'arms': ['elbow_flexors', 'triceps', 'forearms'],
    'triceps': ['triceps'],
    'tricep': ['triceps'],
    'shoulders': ['shoulders'],
    'delts': ['shoulders'],
    'deltoids': ['shoulders'],
    'back': ['back'],
    'lats': ['back'],
    'latissimus': ['back'],
    'rhomboids': ['back'],
    'traps': ['back'],
    'trapezius': ['back'],
    'legs': ['legs', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'adductors'],
    'quads': ['quadriceps'],
    'adductors': ['adductors'],
    'adductor': ['adductors'],
    'quadriceps': ['quadriceps'],
    'hamstrings': ['hamstrings'],
    'glutes': ['glutes'],
    'calves': ['calves'],
    'abs': ['abs'],
    'core': ['abs'],
    'abdominals': ['abs'],
    'forearms': ['forearms'],
    'forearm': ['forearms']
  };
  
  for (const muscle of mentionedMuscles) {
    const categories = muscleMapping[muscle] || [muscle];
    muscleQueries.push(...categories);
  }
  
  return Array.from(new Set(muscleQueries));
}

/**
 * Perform multi-query RAG to gather comprehensive program design context
 * Enhanced to work with KB categories instead of specific article titles
 */
async function performMultiQueryRAG(
  userPrompt: string,
  config: Record<string, unknown>
): Promise<WorkoutProgramContext[]> {
  console.log("🔍 Starting Multi-Query RAG for workout program generation...");
  
  const corePrinciplesCategories = getCoreTrainingPrinciples();
  const mentionedMuscles = extractMuscleGroups(userPrompt);
  const muscleCategories = getMuscleSpecificQueries(mentionedMuscles);
  
  // Combine all categories and add essential ones
  const allCategories = [
    ...corePrinciplesCategories,
    ...muscleCategories,
    'hypertrophy_principles', // Always include core principles
    'myths' // Always include myths for fact-checking
  ];
  
  // Remove duplicates
  const uniqueCategories = Array.from(new Set(allCategories));
  
  console.log(`📋 Searching ${uniqueCategories.length} KB categories:`, uniqueCategories);
  
  const aiConfig = await getAIConfiguration();
  
  // For each category, we'll search using the category name as a query
  // The enhanced knowledge context should handle category-based routing
  const searchPromises = uniqueCategories.map(async (category) => {
    try {
      const results = await getEnhancedKnowledgeContext(
        category, // Use category name as search query
        5, // Increased chunk count per category
        (config.ragSimilarityThreshold as number) || 0.05,
        aiConfig
      );
      
      return { query: category, chunks: results };
    } catch (error) {
      console.error(`❌ Category search failed for "${category}":`, error);
      return { query: category, chunks: [] };
    }
  });
  
  const searchResults = await Promise.all(searchPromises);
  const totalChunks = searchResults.reduce((sum, result) => sum + result.chunks.length, 0);
  console.log(`✅ Multi-Query RAG complete: ${totalChunks} total chunks from ${uniqueCategories.length} categories`);
  
  return searchResults;
}

/**
 * Format comprehensive knowledge context for program generation
 * Enhanced to work with category-based organization
 */
function formatProgramGenerationContext(searchResults: WorkoutProgramContext[]): string {
  if (searchResults.length === 0) return '';
  
  const contextSections: string[] = [];
  
  // Prioritize hypertrophy_programs category content first
  const hypertrophyProgramsResults = searchResults.filter(result => 
    result.query === 'hypertrophy_programs'
  );
  
  if (hypertrophyProgramsResults.length > 0) {
    contextSections.push("## HYPERTROPHY PROGRAM TEMPLATES");
    hypertrophyProgramsResults.forEach(result => {
      if (result.chunks.length > 0) {
        result.chunks.forEach(chunk => {
          contextSections.push(chunk.content);
          contextSections.push("---");
        });
      }
    });
  }
  
  // Add muscle-specific category content
  const muscleCategories = ['chest', 'back', 'shoulders', 'elbow_flexors', 'triceps', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'abs'];
  const muscleResults = searchResults.filter(result => 
    muscleCategories.includes(result.query)
  );
  
  if (muscleResults.length > 0) {
    contextSections.push("\\n## MUSCLE-SPECIFIC TRAINING GUIDANCE");
    muscleResults.forEach(result => {
      if (result.chunks.length > 0) {
        contextSections.push(`\\n### ${result.query.toUpperCase()} TRAINING`);
        result.chunks.forEach(chunk => {
          contextSections.push(chunk.content);
          contextSections.push("---");
        });
      }
    });
  }
  
  // Add hypertrophy principles
  const principlesResults = searchResults.filter(result => 
    result.query === 'hypertrophy_principles'
  );
  
  if (principlesResults.length > 0) {
    contextSections.push("\\n## TRAINING PRINCIPLES");
    principlesResults.forEach(result => {
      if (result.chunks.length > 0) {
        result.chunks.forEach(chunk => {
          contextSections.push(chunk.content);
          contextSections.push("---");
        });
      }
    });
  }
  
  // Add myths for fact-checking (always include to prevent misconceptions)
  const mythsResults = searchResults.filter(result => 
    result.query === 'myths'
  );
  
  if (mythsResults.length > 0) {
    contextSections.push("\\n## MYTHS TO AVOID");
    mythsResults.forEach(result => {
      if (result.chunks.length > 0) {
        result.chunks.forEach(chunk => {
          contextSections.push(chunk.content);
          contextSections.push("---");
        });
      }
    });
  }
  
  return `[KNOWLEDGE]\\n${contextSections.join('\\n')}\\n[/KNOWLEDGE]`;
}

/**
 * Create specialized program designer prompt with requirements implementation
 */
function createProgramDesignerPrompt(
  baseSystemPrompt: string,
  userPrompt: string,
  knowledgeContext: string,
  hypertrophyInstructions?: string
): string {
  // Add hypertrophy instructions to the system prompt if provided
  const hypertrophySection = hypertrophyInstructions ? `

## HYPERTROPHY TRAINING GUIDELINES FROM ADMIN CONFIGURATION
${hypertrophyInstructions}

` : '';

  const programDesignerInstructions = `${hypertrophySection}

# TASK: Workout Program Generation with Strict Requirements

## ENHANCED PROGRAM DESIGN REQUIREMENTS:

1. **KB-Based Training Adherence**: ALL recommendations MUST come from the provided knowledge context
2. **Set Volume Logic Implementation**:
   - 72h frequency (Upper/Lower): 2-4 sets per muscle group per session
   - 48h frequency (Full Body): 1-3 sets per muscle group per session
   - Maximum ~20 total sets per session to avoid excessive fatigue
   - Multiple exercises for same muscle: distribute sets within range

3. **Exercise Selection Compliance**:
   - ONLY use exercises from knowledge base context for hypertrophy programs
   - Prioritize machines and cables for stability

4. **Mandatory Table Format** (DO NOT specify sets/reps for individual exercises):
| Exercise | Notes |
|----------|-------|
| Exercise Name | KB-based guidance and technique notes |

5. **General Volume and Intensity Guidelines** (provide as separate advice):
   - Include general rep ranges (5-10 for hypertrophy) in program overview
   - Mention rest periods (2-5 minutes) as general guidance
   - Reference set volume principles from KB without specifying per exercise
   - Provide frequency recommendations based on training split

6. **Myths Prevention**: Cross-check against misconceptions in KB
7. **Professional Coaching Style**: Expert personal trainer communication

## PROGRAM STRUCTURE GUIDELINES:
- Provide general volume recommendations in program introduction (not per exercise)
- Include overall rep ranges and rest periods as program-wide guidance
- Focus exercise table on movement selection and technique notes only
- Give total session volume targets (e.g., "aim for 10-20 total sets per session")
- Explain frequency patterns (e.g., "train each muscle 2x per week")

Create a comprehensive, evidence-based program following these strict requirements.`;

  return `<SYSTEM_PROMPT>
${baseSystemPrompt}
${programDesignerInstructions}
</SYSTEM_PROMPT>

<KNOWLEDGE>
${knowledgeContext}
</KNOWLEDGE>

<USER_QUERY>
${userPrompt}
</USER_QUERY>`;
}

/**
 * Main function to generate workout program using enhanced RAG
 */
export async function generateWorkoutProgram(
  userPrompt: string,
  config: Record<string, unknown>,
  userProfile: Record<string, unknown>,
  conversationHistory: Array<{ role: string; content: string }> = [],
  selectedModel?: string
): Promise<{ content: string; citations: string[] }> {
  try {
    console.log("🏋️ Starting enhanced workout program generation...");
    
    // 1. Perform multi-query RAG first to get context
    const searchResults = await performMultiQueryRAG(userPrompt, config);
    
    // 2. Format comprehensive knowledge context
    const knowledgeContext = formatProgramGenerationContext(searchResults);
    
    console.log(`📚 Knowledge context prepared: ${knowledgeContext.length} characters`);
    
    // 3. Generate Context-QA system prompt with workout program focus
    const baseSystemPrompt = await getContextQASystemPrompt(userProfile);
    
    // 4. Get hypertrophy training instructions from config
    const hypertrophyInstructions = config.hypertrophyInstructions as string || '';
    console.log(`💪 Hypertrophy instructions included: ${hypertrophyInstructions ? 'Yes' : 'No'}`);
    
    // 5. Create enhanced program designer prompt with hypertrophy instructions
    const fullPrompt = createProgramDesignerPrompt(
      baseSystemPrompt,
      userPrompt,
      knowledgeContext,
      hypertrophyInstructions
    );
    
    console.log(`🔨 Enhanced program designer prompt assembled with hypertrophy guidance`);
    
    // 6. Call Gemini API
    const modelName = getGeminiModelName(selectedModel, config);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: Math.max(0.2, (config.temperature as number) - 0.1),
        topP: config.topP as number,
        topK: config.topK as number,
        maxOutputTokens: Math.min((config.maxTokens as number) * 2, 32768),
      }
    });

    const chat = model.startChat({
      history: conversationHistory.slice(-3).map(msg => ({
        role: msg.role === 'USER' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }))
    });

    console.log("🤖 Calling Gemini API with enhanced prompt...");
    
    const result = await chat.sendMessage([{ text: fullPrompt }]);
    const response = await result.response;
    const content = response.text();
    
    if (!content || content.trim().length === 0) {
      throw new Error("AI generated an empty program response");
    }
    
    console.log(`✅ Enhanced workout program generated: ${content.length} characters`);
    
    // 6. Extract citations
    const citations = searchResults
      .flatMap(result => result.chunks.map(chunk => chunk.title))
      .filter((title, index, array) => array.indexOf(title) === index);
    
    return { content, citations };
    
  } catch (error) {
    console.error('❌ Enhanced workout program generation failed:', error);
    throw new Error(`Failed to generate workout program: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
