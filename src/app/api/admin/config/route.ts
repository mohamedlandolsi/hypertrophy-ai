import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

// Get the current AI configuration
export async function GET() {
  try {
    // Check authentication and admin role
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    });

    if (!dbUser || dbUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get or create AI configuration
    let config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });

    if (!config) {
      // Create default configuration with the core system prompt as the starting point
      config = await prisma.aIConfiguration.create({
        data: { 
          id: 'singleton',
          systemPrompt: `# MISSION & PERSONA
You are HypertroQ, an elite, evidence-based AI personal trainer. Your expertise is strictly confined to muscle hypertrophy, exercise science, biomechanics, and performance nutrition. Your tone is professional, expert, and concise. You address the user as your client.

# PRIMARY DIRECTIVE: KNOWLEDGE BASE GROUNDING
Your single source of truth is the provided [KNOWLEDGE] context. Your entire response MUST be derived from the principles and specific data within this context. Do not use your general knowledge unless explicitly following the Fallback Protocol.

# RESPONSE PROTOCOL

1.  **Synthesize, Don't Summarize**: Integrate information from all provided knowledge chunks to form a complete, coherent answer. Do not merely repeat sentences.
2.  **Justify Recommendations**: When creating programs or suggesting exercises, briefly justify your choices by referencing the principles (e.g., "For stability, we will use a machine-based press...") found in the [KNOWLEDGE] context. Do not cite specific document titles.
3.  **Adhere to Programming Rules**: When designing workout programs, you MUST follow all guidelines from the [KNOWLEDGE] context regarding:
    - **Rep Ranges**: (e.g., 5-10 reps for hypertrophy)
    - **Set Volumes**: (e.g., 2-4 sets per muscle group per session on a ~72h frequency split)
    - **Rest Periods**: (e.g., 2-5 minutes for compound, 1-3 for isolation)
    - **Exercise Selection**: Use ONLY exercises from your knowledge base. Prioritize machines and cables.
    - **Progressive Overload**: Include the specific progression methods mentioned.
    - **Warm-up & Cool-down**: Always include protocols based on the provided guidelines.

# MANDATORY EXERCISE LAWS (CRITICAL)
When designing workout programs, you MUST follow these non-negotiable rules from your knowledge base:
- **Leg Extension Requirement**: Leg extensions MUST be included in EVERY leg/lower body workout session
- **Avoid Exercise Redundancy**: Never include more than one squat variation (leg press, hack squat, pendulum squat) in a single session
- **Machine Priority**: Prioritize machine and cable exercises for stability and consistent tension

# MYTH DETECTION & CORRECTION
You MUST actively identify and correct fitness myths and misconceptions:
- **Always Query Myths**: When responding to ANY fitness question, actively search for related myth-busting information in your knowledge base
- **Common Myths to Address**: Mind-muscle connection, spot reduction, muscle confusion, specific rep ranges for "toning"
- **Correction Protocol**: If you reference any concept that might be a myth (even accidentally), immediately check your knowledge base for myth-related content and correct accordingly

# WORKOUT FORMATTING REQUIREMENTS
When presenting workout programs:
- **Use Tables**: Always format workout programs in clean, readable tables
- **Table Structure**: Exercise | Sets | Reps | Rest | Notes
- **Clear Sections**: Separate upper body, lower body, and different workout days with clear headings
- **Professional Layout**: Use Markdown table formatting for optimal readability

# FALLBACK PROTOCOL
If the [KNOWLEDGE] context does not contain the information needed to answer a user's question, you must follow this sequence precisely:
1.  **Attempt to Generalize**: First, try to formulate an answer based on the foundational principles present in the context (e.g., mechanical tension, high frequency, stability).
2.  **State Limitations Clearly**: If generalization is not possible, you MUST state it clearly. Use phrases like:
    - "Based on my current knowledge base, the specific guidelines for that are not detailed. However, based on the principle of..."
    - "My training data does not cover that specific topic. From a foundational standpoint,..."
3.  **Refuse Off-Topic Queries**: You must refuse to answer any questions outside the domains of fitness, health, nutrition, and human physiology.

# USER PROFILE INTEGRATION
The user's profile information will be provided in the context. You MUST tailor your advice to this data, especially their experience level, goals, and injuries.

# TONE & STYLE
*   **Confident & Authoritative**: You are an expert. Your advice is based on science.
*   **Encouraging & Professional**: Motivate the user while maintaining a professional demeanor.
*   **Concise & Clear**: Avoid jargon where possible. Be direct. No fluff.
*   **Evidence-Based Language**: Always reference that your recommendations come from your knowledge base principles.`
        }
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching AI configuration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update the AI configuration
export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    });

    if (!dbUser || dbUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const {
      systemPrompt,
      freeModelName,
      proModelName,
      temperature,
      maxTokens,
      topK,
      topP,
      ragSimilarityThreshold,
      ragMaxChunks,
      ragHighRelevanceThreshold,
      useKnowledgeBase,
      useClientMemory,
      enableWebSearch,
      toolEnforcementMode,
      strictMusclePriority,
      hypertrophyInstructions
    } = body;

    // Validate required fields and constraints
    if (typeof systemPrompt !== 'string' || systemPrompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'System prompt is required' },
        { status: 400 }
      );
    }

    if (typeof freeModelName !== 'string' || freeModelName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Free tier model name is required' },
        { status: 400 }
      );
    }

    if (typeof proModelName !== 'string' || proModelName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Pro tier model name is required' },
        { status: 400 }
      );
    }

    if (typeof temperature !== 'number' || temperature < 0 || temperature > 2) {
      return NextResponse.json(
        { error: 'Temperature must be between 0 and 2' },
        { status: 400 }
      );
    }

    if (typeof maxTokens !== 'number' || maxTokens < 1 || maxTokens > 65536) {
      return NextResponse.json(
        { error: 'Max tokens must be between 1 and 65536' },
        { status: 400 }
      );
    }

    if (typeof topK !== 'number' || topK < 1 || topK > 100) {
      return NextResponse.json(
        { error: 'Top K must be between 1 and 100' },
        { status: 400 }
      );
    }

    if (typeof topP !== 'number' || topP < 0 || topP > 1) {
      return NextResponse.json(
        { error: 'Top P must be between 0 and 1' },
        { status: 400 }
      );
    }

    if (typeof ragSimilarityThreshold !== 'number' || ragSimilarityThreshold < 0.01 || ragSimilarityThreshold > 1.0) {
      return NextResponse.json(
        { error: 'Similarity Threshold must be between 0.01 and 1.0' },
        { status: 400 }
      );
    }

    if (typeof ragMaxChunks !== 'number' || ragMaxChunks < 1 || ragMaxChunks > 20) {
      return NextResponse.json(
        { error: 'Max Knowledge Chunks must be between 1 and 20' },
        { status: 400 }
      );
    }

    if (typeof ragHighRelevanceThreshold !== 'number' || ragHighRelevanceThreshold < 0.01 || ragHighRelevanceThreshold > 1.0) {
      return NextResponse.json(
        { error: 'High Relevance Threshold must be between 0.01 and 1.0' },
        { status: 400 }
      );
    }

    // Validate toolEnforcementMode if provided
    if (toolEnforcementMode !== undefined && typeof toolEnforcementMode !== 'string') {
      return NextResponse.json(
        { error: 'Tool Enforcement Mode must be a string' },
        { status: 400 }
      );
    }

    // Validate strictMusclePriority if provided
    if (strictMusclePriority !== undefined && typeof strictMusclePriority !== 'boolean') {
      return NextResponse.json(
        { error: 'Strict Muscle Priority must be a boolean' },
        { status: 400 }
      );
    }

    // Update or create configuration
    const updateData = {
      systemPrompt: systemPrompt.trim(),
      freeModelName: freeModelName.trim(),
      proModelName: proModelName.trim(),
      temperature,
      maxTokens,
      topK,
      topP,
      ragSimilarityThreshold,
      ragMaxChunks,
      ragHighRelevanceThreshold,
      useKnowledgeBase: Boolean(useKnowledgeBase),
      useClientMemory: Boolean(useClientMemory),
      enableWebSearch: Boolean(enableWebSearch),
      ...(toolEnforcementMode !== undefined && { toolEnforcementMode: toolEnforcementMode.trim() }),
      ...(strictMusclePriority !== undefined && { strictMusclePriority: Boolean(strictMusclePriority) }),
      ...(hypertrophyInstructions !== undefined && { hypertrophyInstructions: hypertrophyInstructions.trim() })
    };

    const config = await prisma.aIConfiguration.upsert({
      where: { id: 'singleton' },
      update: updateData,
      create: {
        id: 'singleton',
        ...updateData
      }
    });

    return NextResponse.json({
      message: 'Configuration updated successfully',
      config
    });
  } catch (error) {
    console.error('Error updating AI configuration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
