// src/lib/ai/workout-program-generator.ts

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSystemPrompt } from './core-prompts';
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
  
  // If selectedModel is provided and valid, use it
  if (selectedModel && modelMap[selectedModel]) {
    console.log(`🎯 Workout program using selected model: ${selectedModel} → ${modelMap[selectedModel]}`);
    return modelMap[selectedModel];
  }
  
  // Fall back to config or default
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
    'create a program',
    'create program',
    'workout program',
    'training program',
    'workout plan',
    'training plan',
    'routine',
    'schedule me a workout',
    'schedule workout',
    'design a program',
    'design program',
    'build a program',
    'build program',
    'workout routine',
    'training routine',
    'full program',
    'weekly plan',
    'split routine',
    'training split',
    'program for me',
    'workout schedule',
    'create.*workout',
    'create.*training',
    'design.*workout',
    'design.*training',
    'build.*workout',
    'build.*training'
  ];
  
  // Check for exact keyword matches
  const hasExactMatch = programKeywords.some(keyword => lowerPrompt.includes(keyword));
  
  // Check for pattern-based matches (using regex for flexibility)
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
  
  // Keywords that indicate the user is presenting their own program for review
  const reviewKeywords = [
    'review my program',
    'review my workout',
    'review my routine',
    'check my program',
    'check my workout', 
    'check my routine',
    'evaluate my program',
    'evaluate my workout',
    'evaluate my routine',
    'analyze my program',
    'analyze my workout',
    'analyze my routine',
    'feedback on my program',
    'feedback on my workout',
    'feedback on my routine',
    'give me feedback on my',
    'what do you think of my program',
    'what do you think of my workout',
    'what do you think of my routine',
    'thoughts on my program',
    'thoughts on my workout',
    'thoughts on my routine',
    'rate my program',
    'rate my workout',
    'rate my routine',
    'critique my program',
    'critique my workout',
    'critique my routine'
  ];
  
  // Check for exact keyword matches
  const hasExactMatch = reviewKeywords.some(keyword => lowerPrompt.includes(keyword));
  
  // Pattern-based detection for program presentation
  const reviewPatterns = [
    // Common patterns for presenting programs
    /here.*is.*my.*program/i,
    /here.*is.*my.*workout/i,
    /here.*is.*my.*routine/i,
    /this.*is.*my.*program/i,
    /this.*is.*my.*workout/i,
    /this.*is.*my.*routine/i,
    /my.*current.*program/i,
    /my.*current.*workout/i,
    /my.*current.*routine/i,
    /i.*am.*doing.*this.*program/i,
    /i.*am.*doing.*this.*workout/i,
    /i.*am.*following.*this.*program/i,
    /currently.*doing.*this.*program/i,
    /currently.*doing.*this.*workout/i,
    /is.*this.*program.*good/i,
    /is.*this.*workout.*good/i,
    /is.*this.*routine.*good/i,
    /does.*this.*program.*look.*good/i,
    /does.*this.*workout.*look.*good/i
  ];
  
  const hasPatternMatch = reviewPatterns.some(pattern => pattern.test(prompt));
  
  // Additional check: if prompt contains structured workout data (multiple exercises, sets/reps patterns)
  const hasWorkoutStructure = checkForWorkoutStructure(prompt);
  
  return hasExactMatch || hasPatternMatch || hasWorkoutStructure;
}

/**
 * Check if the prompt contains structured workout data indicating program presentation
 */
function checkForWorkoutStructure(prompt: string): boolean {
  // Count exercise-like patterns (exercise names with sets/reps)
  const exercisePatterns = [
    /\d+\s*x\s*\d+/g, // "3x10", "4 x 8", etc.
    /\d+\s*sets?\s*of\s*\d+/gi, // "3 sets of 10"
    /\d+\s*reps?/gi, // "10 reps"
    /\d+\s*sets?/gi, // "3 sets"
  ];
  
  let exerciseIndicators = 0;
  exercisePatterns.forEach(pattern => {
    const matches = prompt.match(pattern);
    if (matches) {
      exerciseIndicators += matches.length;
    }
  });
  
  // Check for common exercise names (basic detection)
  const commonExercises = [
    'squat', 'deadlift', 'bench press', 'row', 'pull up', 'pullup', 'push up', 'pushup',
    'curl', 'extension', 'raise', 'press', 'fly', 'dip', 'lunge', 'calf raise',
    'lat pulldown', 'overhead press', 'shoulder press', 'chest press', 'leg press'
  ];
  
  const exerciseCount = commonExercises.filter(exercise => 
    prompt.toLowerCase().includes(exercise)
  ).length;
  
  // If we have multiple set/rep patterns AND multiple exercises, likely a program
  return exerciseIndicators >= 3 && exerciseCount >= 2;
}

/**
 * Extract mentioned muscle groups from user prompt for targeted searches
 */
function extractMuscleGroups(prompt: string): string[] {
  const lowerPrompt = prompt.toLowerCase();
  const muscleGroups = [
    'chest', 'pectorals', 'pecs',
    'biceps', 'bicep', 'arms',
    'triceps', 'tricep',
    'shoulders', 'delts', 'deltoids',
    'back', 'lats', 'latissimus', 'rhomboids', 'traps', 'trapezius',
    'legs', 'quads', 'quadriceps', 'hamstrings', 'glutes', 'calves',
    'abs', 'core', 'abdominals',
    'forearms', 'forearm'
  ];
  
  return muscleGroups.filter(muscle => lowerPrompt.includes(muscle));
}

/**
 * Define core principles needed for comprehensive program design
 */
function getCoreTrainingPrinciples(): string[] {
  return [
    'A Guide to Setting Your Training Volume',
    'A Guide to Common Training Splits',
    'A Guide to High-Frequency Training',
    'A Guide to Rep Ranges',
    'A Guide to Rest Periods',
    'A Guide to Efficient Exercise Selection',
    'A Guide to Progressive Overload',
    'A Guide to Training Frequency',
    'A Guide to Periodization',
    'Effective Workout Programming',
    'Training Volume Guidelines',
    'Exercise Selection Principles'
  ];
}

/**
 * Generate muscle-specific search queries
 */
function getMuscleSpecificQueries(mentionedMuscles: string[]): string[] {
  const muscleQueries: string[] = [];
  
  // Map muscle mentions to knowledge base article patterns
  const muscleMapping: Record<string, string[]> = {
    'chest': ['A Guide to Effective Chest Training', 'Chest Exercise Selection'],
    'pectorals': ['A Guide to Effective Chest Training', 'Chest Exercise Selection'],
    'pecs': ['A Guide to Effective Chest Training', 'Chest Exercise Selection'],
    'biceps': ['A Guide to Effective Arm Training', 'Bicep Training Guide'],
    'bicep': ['A Guide to Effective Arm Training', 'Bicep Training Guide'],
    'triceps': ['A Guide to Effective Arm Training', 'Tricep Training Guide'],
    'tricep': ['A Guide to Effective Arm Training', 'Tricep Training Guide'],
    'arms': ['A Guide to Effective Arm Training'],
    'shoulders': ['A Guide to Effective Shoulder Training', 'Shoulder Exercise Selection'],
    'delts': ['A Guide to Effective Shoulder Training', 'Shoulder Exercise Selection'],
    'deltoids': ['A Guide to Effective Shoulder Training', 'Shoulder Exercise Selection'],
    'back': ['A Guide to Effective Back Training', 'Back Exercise Selection'],
    'lats': ['A Guide to Effective Back Training', 'Latissimus Dorsi Training'],
    'legs': ['A Guide to Effective Leg Training', 'Lower Body Training'],
    'quads': ['A Guide to Effective Leg Training', 'Quadriceps Training'],
    'hamstrings': ['A Guide to Effective Leg Training', 'Hamstring Training'],
    'glutes': ['A Guide to Effective Leg Training', 'Glute Training'],
    'calves': ['A Guide to Effective Leg Training', 'Calf Training'],
    'abs': ['A Guide to Effective Core Training', 'Abdominal Training'],
    'core': ['A Guide to Effective Core Training', 'Core Exercise Selection']
  };
  
  for (const muscle of mentionedMuscles) {
    const queries = muscleMapping[muscle] || [`${muscle} training guide`];
    muscleQueries.push(...queries);
  }
  
  return [...new Set(muscleQueries)]; // Remove duplicates
}

/**
 * Perform multi-query RAG to gather comprehensive program design context
 */
async function performMultiQueryRAG(
  userPrompt: string,
  config: Record<string, unknown>
): Promise<WorkoutProgramContext[]> {
  console.log("🔍 Starting Multi-Query RAG for workout program generation...");
  
  // Get core training principles
  const corePrinciples = getCoreTrainingPrinciples();
  
  // Extract mentioned muscle groups and get specific queries
  const mentionedMuscles = extractMuscleGroups(userPrompt);
  const muscleQueries = getMuscleSpecificQueries(mentionedMuscles);
  
  // Combine all queries
  const allQueries = [
    ...corePrinciples,
    ...muscleQueries,
    userPrompt // Include original prompt as well
  ];
  
  console.log(`📋 Executing ${allQueries.length} targeted searches:`);
  console.log(`   - Core principles: ${corePrinciples.length}`);
  console.log(`   - Muscle-specific: ${muscleQueries.length}`);
  console.log(`   - Original prompt: 1`);
  
  // Execute all searches in parallel for performance
  const aiConfig = await getAIConfiguration();
  
  const searchPromises = allQueries.map(async (query) => {
    try {
      const results = await getEnhancedKnowledgeContext(
        query,
        2, // Top 2 chunks per query
        (config.ragSimilarityThreshold as number) || 0.05,
        aiConfig
      );
      
      return {
        query,
        chunks: results
      };
    } catch (error) {
      console.error(`❌ Search failed for "${query}":`, error);
      return {
        query,
        chunks: []
      };
    }
  });
  
  const searchResults = await Promise.all(searchPromises);
  
  // Log results
  const totalChunks = searchResults.reduce((sum, result) => sum + result.chunks.length, 0);
  console.log(`✅ Multi-Query RAG complete: ${totalChunks} total chunks retrieved`);
  
  return searchResults;
}

/**
 * Format comprehensive knowledge context for program generation
 */
function formatProgramGenerationContext(searchResults: WorkoutProgramContext[]): string {
  if (searchResults.length === 0) {
    return '';
  }
  
  const contextSections: string[] = [];
  
  // Group by search type
  const coreResults = searchResults.filter(result => 
    getCoreTrainingPrinciples().includes(result.query)
  );
  const muscleResults = searchResults.filter(result => 
    !getCoreTrainingPrinciples().includes(result.query) && result.query !== result.query
  );
  
  // Add core training principles
  if (coreResults.length > 0) {
    contextSections.push("## CORE TRAINING PRINCIPLES");
    coreResults.forEach(result => {
      if (result.chunks.length > 0) {
        result.chunks.forEach(chunk => {
          contextSections.push(chunk.content);
          contextSections.push("---");
        });
      }
    });
  }
  
  // Add muscle-specific guidance
  if (muscleResults.length > 0) {
    contextSections.push("\n## MUSCLE-SPECIFIC TRAINING GUIDANCE");
    muscleResults.forEach(result => {
      if (result.chunks.length > 0) {
        result.chunks.forEach(chunk => {
          contextSections.push(chunk.content);
          contextSections.push("---");
        });
      }
    });
  }
  
  // Add any remaining results
  const otherResults = searchResults.filter(result => 
    !coreResults.includes(result) && !muscleResults.includes(result)
  );
  
  if (otherResults.length > 0) {
    contextSections.push("\n## ADDITIONAL CONTEXT");
    otherResults.forEach(result => {
      if (result.chunks.length > 0) {
        result.chunks.forEach(chunk => {
          contextSections.push(chunk.content);
          contextSections.push("---");
        });
      }
    });
  }
  
  return `[KNOWLEDGE]\n${contextSections.join('\n')}\n[/KNOWLEDGE]`;
}

/**
 * Create specialized program designer prompt
 */
/**
 * Creates a structured prompt using XML delimiters for clear separation
 * This format helps the model distinguish instructions from data
 */
function createProgramDesignerPrompt(
  baseSystemPrompt: string,
  userPrompt: string,
  knowledgeContext: string
): string {
  const programDesignerInstructions = `

# TASK: Workout Program Generation

You are now in Program Designer Mode. The user has requested a full workout program. Using the comprehensive knowledge provided on volume, splits, frequency, rep ranges, rest periods, and specific muscle training, construct a detailed and logically structured weekly training plan.

## PROGRAM DESIGN REQUIREMENTS:

1. **Training Adherence**: The program MUST adhere strictly to the principles in the provided training context. Every recommendation must be backed by the provided information.

2. **Evidence-Based Justification**: Justify key choices (like the split chosen, volume per muscle, exercise selection) based on established training principles, without citing specific sources.

3. **Complete Program Structure**: Include:
   - Training split overview
   - Weekly schedule
   - Exercise selection with sets, reps, and rest periods (MUST use validated exercises from the provided database)
   - Progressive overload strategy
   - Volume distribution across muscle groups

4. **MANDATORY Exercise Selection Requirements**:
   - Use ONLY exercises from the validated exercise database provided in the knowledge context
   - Prioritize machine and cable exercises over free weights
   - If a specific muscle group needs coverage, choose from the validated list for that muscle
   - Never suggest exercises not explicitly listed in the validated database
   - Explain exercise choices based on muscle targeting and movement patterns from the validated list

5. **Output Format**: Present the final program in well-formatted Markdown with:
   - Clear headings and sections
   - Tables for workout schedules
   - Bullet points for exercise details
   - Rationale sections explaining key decisions

6. **Personalization**: Incorporate the user's profile information, goals, experience level, and any mentioned preferences or limitations.

7. **Safety Considerations**: Address any injuries or limitations mentioned in the user profile or prompt.

## PROGRAM STRUCTURE TEMPLATE:

### Program Overview
- Split type and justification
- Training frequency
- Program duration

### Weekly Schedule
- Day-by-day breakdown
- Muscle groups trained each day

### Exercise Details
- Specific exercises with justification
- Sets, reps, and rest periods
- Progressive overload guidelines

### Notes & Rationale
- Key decision explanations based on training principles
- Adaptation guidelines
- Safety considerations

Now, create a comprehensive workout program based on the user's request and the provided knowledge base context.`;

  // Assemble structured prompt using XML delimiters
  let structuredPrompt = "";
  
  structuredPrompt += "<SYSTEM_PROMPT>\n";
  structuredPrompt += baseSystemPrompt;
  structuredPrompt += programDesignerInstructions;
  structuredPrompt += "\n</SYSTEM_PROMPT>\n\n";
  
  structuredPrompt += "<KNOWLEDGE>\n";
  structuredPrompt += knowledgeContext;
  structuredPrompt += "\n</KNOWLEDGE>\n\n";
  
  structuredPrompt += "<USER_QUERY>\n";
  structuredPrompt += userPrompt;
  structuredPrompt += "\n</USER_QUERY>\n";

  return structuredPrompt;
}

/**
 * Main function to generate workout program using multi-query RAG
 */
export async function generateWorkoutProgram(
  userPrompt: string,
  config: Record<string, unknown>,
  userProfile: Record<string, unknown>,
  conversationHistory: Array<{ role: string; content: string }> = [],
  selectedModel?: string
): Promise<{ content: string; citations: string[] }> {
  try {
    console.log("🏋️ Starting workout program generation...");
    
    // 1. Generate base system prompt with user profile
    const baseSystemPrompt = await getSystemPrompt(userProfile);
    
    // 2. Perform multi-query RAG
    const searchResults = await performMultiQueryRAG(userPrompt, config);
    
    // 3. Format comprehensive knowledge context
    const knowledgeContext = formatProgramGenerationContext(searchResults);
    
    console.log(`📚 Knowledge context prepared: ${knowledgeContext.length} characters`);
    
    // 4. Create specialized program designer prompt
    const fullPrompt = createProgramDesignerPrompt(
      baseSystemPrompt,
      userPrompt,
      knowledgeContext
    );
    
    console.log(`🔨 Program designer prompt assembled: ${fullPrompt.length} characters`);
    
    // 5. Call Gemini API with structured prompt
    const modelName = getGeminiModelName(selectedModel, config);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: Math.max(0.2, (config.temperature as number) - 0.1), // Slightly lower temperature for structured output
        topP: config.topP as number,
        topK: config.topK as number,
        maxOutputTokens: Math.min((config.maxTokens as number) * 2, 32768), // Higher limit for detailed programs
      }
    });

    // Use minimal conversation history and send structured prompt
    const chat = model.startChat({
      history: conversationHistory.slice(-3).map(msg => ({
        role: msg.role === 'USER' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      })) // Keep only recent context
    });

    console.log("🤖 Calling Gemini API with structured prompt for program generation...");
    
    const result = await chat.sendMessage([{ text: fullPrompt }]);
    const response = await result.response;
    const content = response.text();
    
    if (!content || content.trim().length === 0) {
      throw new Error("AI generated an empty program response");
    }
    
    console.log(`✅ Workout program generated: ${content.length} characters`);
    
    // 6. Extract citations from the knowledge context
    const citations = searchResults
      .flatMap(result => result.chunks.map(chunk => chunk.title))
      .filter((title, index, array) => array.indexOf(title) === index); // Remove duplicates
    
    return {
      content,
      citations
    };
    
  } catch (error) {
    console.error('❌ Workout program generation failed:', error);
    throw new Error(`Failed to generate workout program: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
