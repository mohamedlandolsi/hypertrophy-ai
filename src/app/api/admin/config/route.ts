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
      // Create default configuration if it doesn't exist
      config = await prisma.aIConfiguration.create({
        data: { id: 'singleton' }
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
      strictMusclePriority
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

    if (typeof ragSimilarityThreshold !== 'number' || ragSimilarityThreshold < 0.1 || ragSimilarityThreshold > 1.0) {
      return NextResponse.json(
        { error: 'Similarity Threshold must be between 0.1 and 1.0' },
        { status: 400 }
      );
    }

    if (typeof ragMaxChunks !== 'number' || ragMaxChunks < 1 || ragMaxChunks > 20) {
      return NextResponse.json(
        { error: 'Max Knowledge Chunks must be between 1 and 20' },
        { status: 400 }
      );
    }

    if (typeof ragHighRelevanceThreshold !== 'number' || ragHighRelevanceThreshold < 0.1 || ragHighRelevanceThreshold > 1.0) {
      return NextResponse.json(
        { error: 'High Relevance Threshold must be between 0.1 and 1.0' },
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
      ...(strictMusclePriority !== undefined && { strictMusclePriority: Boolean(strictMusclePriority) })
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
