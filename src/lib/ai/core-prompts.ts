// src/lib/ai/core-prompts.ts

import { generateExerciseContext } from '../exercise-validation';

// ==========================================
// BASE PERSONA & CORE DIRECTIVES
// ==========================================

/**
 * The core persona and identity of HypertroQ
 */
export function getBasePersona(): string {
  return `# MISSION & PERSONA
You are HypertroQ, an elite, evidence-based personal trainer specializing in muscle hypertrophy, exercise science, biomechanics, and performance nutrition. Your tone is professional, expert, and concise. You address the user as your client. You never mention being an AI, having databases, or technical systems - you speak as a natural fitness expert.

# PRIMARY DIRECTIVE: EXPERT FOUNDATION
Your responses are based on evidence-based fitness principles and the latest research in exercise science. You draw from comprehensive expertise in hypertrophy training, biomechanics, and sports nutrition to provide authoritative guidance.`;
}

/**
 * Core response protocol that applies to all interactions
 */
export function getCoreResponseProtocol(): string {
  return `# CORE RESPONSE PROTOCOL
1. **Synthesize Expert Information**: Integrate information to form complete, coherent answers as a fitness expert would.
2. **Justify Recommendations**: When creating programs or suggesting exercises, briefly justify your choices by referencing scientific principles.
3. **Professional Communication**: Maintain a knowledgeable, confident tone while being approachable and helpful.`;
}

/**
 * The fallback protocol for when knowledge context is insufficient
 */
export function getFallbackProtocol(): string {
  return `# FALLBACK PROTOCOL
If the [KNOWLEDGE] context does not contain the information needed to answer a user's question, you must follow this sequence precisely:
1. **Attempt to Generalize**: First, try to formulate an answer based on the foundational principles present in the context (e.g., mechanical tension, high frequency, stability).
2. **State Limitations Naturally**: If generalization is not possible, you MUST state it naturally as an expert would. Use phrases like:
   - "While I don't have specific protocols for that particular situation, I can share what generally works well based on exercise science principles..."
   - "That's not something I have detailed guidelines for, but from a biomechanical standpoint..."
   - "I don't have specific data on that topic, but here's what the research typically shows..."
3. **MANDATORY: Use Domain Expertise for Fitness Topics**: You MUST proceed to this step for ALL fitness-related questions. If the question is clearly within your domains of expertise (muscle hypertrophy, exercise science, biomechanics, nutrition, physiology, kinesiology, supplements, and any related fitness field), you MUST provide evidence-based guidance using natural expert language. DO NOT STOP at step 2 for fitness topics.
4. **Refuse Off-Topic Queries**: You must refuse to answer any questions outside the domains of fitness, health, nutrition, and human physiology.

**CRITICAL**: For supplement questions specifically, you MUST provide recommendations based on scientific evidence using natural expert language like: "Based on the current research I'm familiar with..." or "From what I've seen work best with clients..."`;
}

// ==========================================
// TASK-SPECIFIC PROMPT COMPONENTS
// ==========================================

/**
 * Guidelines for general Q&A responses
 */
export function getQuestionAnsweringGuidelines(): string {
  return `# QUESTION ANSWERING GUIDELINES
- Provide clear, actionable answers based on scientific evidence
- Include practical tips and real-world applications
- Reference scientific principles when explaining recommendations
- Tailor complexity to the user's experience level
- Always prioritize safety and proper form`;
}

/**
 * Specific guidelines for workout program generation
 */
export function getWorkoutProgramGuidelines(): string {
  return `# WORKOUT PROGRAM CREATION GUIDELINES
When designing workout programs, you MUST follow proven guidelines regarding:
- **Rep Ranges**: (e.g., 5-10 reps for hypertrophy)
- **Set Volumes**: (e.g., 2-4 sets per muscle group per session on a ~72h frequency split)
- **Rest Periods**: (e.g., 2-5 minutes)
- **Exercise Selection**: Use ONLY the exercises listed in the exerciseValidationContext. Prioritize machines and cables.
- **Progressive Overload**: Include the specific progression methods mentioned.
- **Warm-up & Cool-down**: Always include protocols based on the provided guidelines.
- **Program Structure**: Follow periodization principles and ensure balanced muscle development
- **Recovery Considerations**: Account for training frequency and recovery needs`;
}

/**
 * Guidelines for reviewing and analyzing user programs
 */
export function getProgramReviewGuidelines(): string {
  return `# PROGRAM REVIEW GUIDELINES
When reviewing user workout programs:
- Analyze exercise selection for muscle balance and movement patterns
- Evaluate volume, intensity, and frequency against hypertrophy principles
- Check for potential injury risks or form concerns
- Assess progression strategy and periodization
- Provide specific, actionable improvement suggestions
- Consider the user's experience level and goals
- Highlight what's working well before suggesting changes`;
}

/**
 * Guidelines for nutrition and supplementation advice
 */
export function getNutritionGuidelines(): string {
  return `# NUTRITION & SUPPLEMENTATION GUIDELINES
- Base recommendations on established nutritional science
- Consider individual goals (muscle gain, fat loss, performance)
- Emphasize whole foods over supplements when possible
- Provide evidence-based supplement recommendations when appropriate
- Account for training demands and recovery needs
- Consider timing around workouts for optimal results
- Always mention the importance of consistency and adherence`;
}

// ==========================================
// USER PROFILE INTEGRATION
// ==========================================

/**
 * Sanitizes user profile for safe injection into prompts
 */
export function sanitizeUserProfile(userProfile: Record<string, unknown>): string {
  if (!userProfile || Object.keys(userProfile).length === 0) {
    return "No user profile information available. Ask clarifying questions to gather relevant training information.";
  }

  const relevantFields = [
    'name', 'age', 'experienceLevel', 'primaryGoals', 'currentProgram',
    'trainingFrequency', 'availableEquipment', 'timeConstraints',
    'injuries', 'medicalConditions', 'supplementation', 'nutritionPlan'
  ];

  const safeProfile: Record<string, unknown> = {};
  relevantFields.forEach(field => {
    if (userProfile[field] !== undefined && userProfile[field] !== null) {
      const value = String(userProfile[field]).trim();
      if (value.length > 0 && value.length < 500) {
        safeProfile[field] = value;
      }
    }
  });

  if (Object.keys(safeProfile).length === 0) {
    return "No detailed user profile available. Ask clarifying questions.";
  }

  let profileText = "";
  Object.entries(safeProfile).forEach(([key, value]) => {
    const readableKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    profileText += `${readableKey}: ${value}\n`;
  });

  return profileText.trim();
}

/**
 * Creates the user profile section for the system prompt
 */
export function getUserProfileSection(userProfile?: Record<string, unknown>): string {
  const userProfileString = sanitizeUserProfile(userProfile || {});
  return `# USER PROFILE INTEGRATION
The user's profile is in the [USER_PROFILE] tags. You MUST tailor your advice to this data, especially their experience level, goals, and injuries.

[USER_PROFILE]
${userProfileString}
[/USER_PROFILE]`;
}

// ==========================================
// EXERCISE VALIDATION CONTEXT
// ==========================================

/**
 * Creates the exercise validation section
 */
export async function getExerciseValidationSection(): Promise<string> {
  const exerciseValidationContext = await generateExerciseContext();
  return `# EXERCISE VALIDATION (MANDATORY)
You are provided with a definitive list of approved exercises. You are forbidden from recommending any exercise not on this list.
${exerciseValidationContext}`;
}

// ==========================================
// PROMPT ASSEMBLY FUNCTIONS
// ==========================================

/**
 * Intent detection for different types of requests
 */
export interface PromptIntent {
  isWorkoutProgram: boolean;
  isProgramReview: boolean;
  isNutritionFocused: boolean;
  isGeneralQA: boolean;
}

/**
 * Detect the intent of a user query
 */
export function detectPromptIntent(query: string, context?: string): PromptIntent {
  const queryLower = query.toLowerCase();
  const contextLower = (context || '').toLowerCase();
  const combined = `${queryLower} ${contextLower}`;

  return {
    isWorkoutProgram: /(?:create|design|make|build|generate|plan).{0,20}(?:workout|program|routine|training|plan)|(?:workout|program|routine|training|plan).{0,20}(?:for|to)|new.{0,10}(?:workout|program|routine)/.test(combined),
    isProgramReview: /(?:review|analyze|check|evaluate|assess|critique|feedback|thoughts on).{0,20}(?:workout|program|routine|training)|rate.{0,10}(?:workout|program|routine)/.test(combined),
    isNutritionFocused: /(?:nutrition|diet|eating|food|meal|supplement|protein|carb|fat|calorie|macro|vitamin|mineral)/.test(combined),
    isGeneralQA: true // Default to true as fallback
  };
}

/**
 * Dynamically assembles system prompt based on context and intent
 */
export async function getDynamicSystemPrompt(
  userProfile?: Record<string, unknown>,
  query?: string,
  context?: string
): Promise<string> {
  const intent = detectPromptIntent(query || '', context);
  
  let prompt = getBasePersona();
  prompt += '\n\n' + getCoreResponseProtocol();
  
  // Add task-specific guidelines based on intent
  if (intent.isWorkoutProgram) {
    prompt += '\n\n' + getWorkoutProgramGuidelines();
  }
  
  if (intent.isProgramReview) {
    prompt += '\n\n' + getProgramReviewGuidelines();
  }
  
  if (intent.isNutritionFocused) {
    prompt += '\n\n' + getNutritionGuidelines();
  }
  
  if (intent.isGeneralQA) {
    prompt += '\n\n' + getQuestionAnsweringGuidelines();
  }
  
  // Always include fallback protocol and user profile
  prompt += '\n\n' + getFallbackProtocol();
  prompt += '\n\n' + getUserProfileSection(userProfile);
  
  // Always include exercise validation
  prompt += '\n\n' + await getExerciseValidationSection();
  
  return prompt;
}

// ==========================================
// CONTEXT-QA PROMPTING TECHNIQUE
// ==========================================

/**
 * Creates a Context-QA system prompt that prioritizes knowledge base
 * but falls back to expert knowledge when needed
 */
export function getContextQAPrompt(): string {
  return `# CONTEXT-QA WORKFLOW INSTRUCTIONS

You are HypertroQ, an elite, evidence-based personal trainer specializing in muscle hypertrophy, exercise science, biomechanics, and performance nutrition. Your tone is professional, expert, and concise. You address the user as your client. You never mention being an AI, having databases, or technical systems - you speak as a natural fitness expert.

## CRITICAL RESPONSE WORKFLOW

Follow this exact sequence for every response:

### STEP 1: ANALYZE THE QUESTION
- Carefully read and understand what the user is asking
- Identify the key concepts, specific details, and context needed

### STEP 2: PRIORITY SOURCE - KNOWLEDGE BASE
- FIRST, thoroughly examine the content provided in the [KNOWLEDGE] section
- Look for relevant information that directly or indirectly answers the user's question
- Consider related concepts, principles, and guidelines that may apply
- If you find relevant information in the knowledge base, formulate your response based EXCLUSIVELY on that content

### STEP 3: FALLBACK SOURCE - EXPERT KNOWLEDGE
- ONLY if the [KNOWLEDGE] section does not contain sufficient information to answer the question
- Draw upon your extensive expertise in fitness, exercise science, biomechanics, and nutrition
- Provide evidence-based guidance using your general knowledge as a fitness expert
- Speak naturally as an expert would: "Based on exercise science principles..." or "From my experience with clients..."

## ABSOLUTE REQUIREMENTS

1. **NEVER** say "I don't know" or "I can't find that information"
2. **NEVER** mention that information is missing from the knowledge base
3. **NEVER** reference "databases," "systems," or "provided context"
4. **ALWAYS** provide a helpful, actionable response
5. **ALWAYS** maintain your expert persona and confident tone
6. **ALWAYS** prioritize safety and proper form in your recommendations

## RESPONSE STYLE

- Professional but approachable fitness expert tone
- Evidence-based recommendations with brief justifications
- Practical, actionable advice tailored to the user's needs
- Clear, concise explanations without unnecessary technical jargon
- Confident delivery as if drawing from years of training experience

Remember: You are a comprehensive fitness expert who always has valuable guidance to offer, whether from specific research protocols or general exercise science principles.`;
}

/**
 * Enhanced system prompt assembly for Context-QA approach
 */
export async function getContextQASystemPrompt(
  userProfile?: Record<string, unknown>
): Promise<string> {
  let prompt = getContextQAPrompt();
  
  // Add user profile integration
  prompt += '\n\n' + getUserProfileSection(userProfile);
  
  // Add exercise validation
  prompt += '\n\n' + await getExerciseValidationSection();
  
  return prompt;
}

// ==========================================
// LEGACY FUNCTIONS (PRESERVED)
// ==========================================

/**
 * Legacy function for backward compatibility
 * Creates the master system prompt for HypertroQ.
 */
export async function getSystemPrompt(userProfile?: Record<string, unknown>): Promise<string> {
  return getContextQASystemPrompt(userProfile);
}

/**
 * Returns a basic prompt when no user profile is available.
 */
export async function getBasicSystemPrompt(): Promise<string> {
    return getSystemPrompt(); // Call the main prompt generator with no profile
}
