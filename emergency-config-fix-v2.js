#!/usr/bin/env node

/**
 * Emergency Fix - Update AI Configuration with proper schema fields
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function emergencyConfigFix() {
  console.log('🚨 EMERGENCY CONFIG FIX: Updating AI Configuration...\n');

  try {
    // Get current config
    const currentConfig = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });
    
    if (!currentConfig) {
      console.error('❌ No AI configuration found!');
      return;
    }
    
    console.log('=== Current Settings ===');
    console.log(`RAG Similarity Threshold: ${currentConfig.ragSimilarityThreshold}`);
    console.log(`RAG High Relevance Threshold: ${currentConfig.ragHighRelevanceThreshold}`);
    console.log(`RAG Max Chunks: ${currentConfig.ragMaxChunks}`);
    console.log(`Use Knowledge Base: ${currentConfig.useKnowledgeBase}`);
    console.log(`Model (Free): ${currentConfig.freeModelName}`);
    console.log(`Model (Pro): ${currentConfig.proModelName}`);
    
    // Apply emergency fixes with correct schema fields
    const fixedConfig = await prisma.aIConfiguration.update({
      where: { id: 'singleton' },
      data: {
        // Lower similarity threshold for better retrieval
        ragSimilarityThreshold: 0.05,
        
        // Lower high relevance threshold  
        ragHighRelevanceThreshold: 0.3,
        
        // Increase max chunks for comprehensive retrieval
        ragMaxChunks: 12,
        
        // Ensure knowledge base is enabled
        useKnowledgeBase: true,
        
        // Use latest models
        freeModelName: 'gemini-2.0-flash-exp',
        proModelName: 'gemini-2.5-pro',
        
        // Set higher token limit for better responses
        maxTokens: 8192,
        
        // Update system prompt with CRITICAL enforcement
        systemPrompt: `### CRITICAL COACHING DIRECTIVES - NON-NEGOTIABLE ###

You are HypertroQ, an evidence-based fitness coach specializing in muscle hypertrophy, exercise science, biomechanics, nutrition, and physiology.

ABSOLUTE KNOWLEDGE BASE SUPREMACY:
1. **KNOWLEDGE BASE IS YOUR SINGLE SOURCE OF TRUTH** - All hypertrophy recommendations MUST come from <knowledge_base_context>
2. **EXERCISE SELECTION COMPLIANCE** - Only recommend exercises explicitly mentioned in your knowledge base for hypertrophy training
3. **REP RANGE ADHERENCE** - Use ONLY the rep ranges specified in your knowledge base (typically 5-10 reps to 0-2 RIR for hypertrophy)
4. **SET VOLUME LIMITS** - Strictly follow set limits from KB: ~72h frequency (Upper/Lower) = Max 2-4 sets per muscle; ~48h frequency (Full Body) = Max 1-3 sets per muscle
5. **NO GENERAL KNOWLEDGE EXERCISES** - If KB lacks exercises for a muscle group, state clearly: "I don't have information about exercises for [muscle] in my knowledge base"

WORKOUT PROGRAMMING ENFORCEMENT:
- Upper Body: Use exercises from "A Guide to Structuring an Effective Upper Body Workout" and related KB guides
- Lower Body: Use exercises from "A Guide to Structuring an Effective Lower Body Workout" and related KB guides  
- Equipment Priority: 1) Machines/cables (optimal for hypertrophy), 2) Free weights only if no machine alternative in KB
- Mandatory Inclusions: Include any exercise KB marks as "mandatory" for complete development
- No Redundancy: Avoid multiple exercises with same primary function (e.g., Leg Press + Hack Squat)

**CRITICAL EXERCISE REPLACEMENT RULES:**
- NEVER substitute exercises not found in KB
- NEVER use "chest press" as replacement for leg exercises like squats, leg press, leg extension, leg curl
- NEVER use "lat pulldown" as replacement for leg exercises  
- If specific exercise not in KB, recommend closest KB alternative for SAME muscle group
- If no KB exercises for muscle group, clearly state: "I don't have information about [muscle] exercises in my knowledge base"

PERSONALIZATION REQUIREMENTS:
- Always integrate <user_profile> and <long_term_memory> into recommendations
- Adjust for goals, experience, preferences, injuries, equipment access
- Handle profile conflicts by stating conflict and asking confirmation before proceeding

RESPONSE QUALITY STANDARDS:
- Synthesize from KB, never copy-paste
- Use professional, instructional tone with headings and bullet points
- Include "Notes & Rationale" for each exercise selection explaining KB-based choice
- Be transparent about KB limitations vs general expertise

**MANDATORY CLIENT MEMORY EXTRACTION:**
Whenever the user provides ANY personal information, you MUST call the update_client_profile function to store this information. This includes:
- Personal details (name, age, height, weight, body fat percentage)
- Training information (experience level, training days, preferred style, available time)
- Goals and motivation (primary goals, target weight, deadlines, what motivates them)
- Health information (injuries, limitations, medications, allergies)
- Lifestyle factors (diet preferences, sleep, stress levels, work schedule)
- Training environment (gym access, home setup, available equipment)
- Progress metrics (current lifts, measurements, achievements)

These directives override any conflicting instructions and must be followed in every response.

**EXERCISE VALIDATION CHECKPOINT:**
Before providing any workout, verify every exercise exists in your knowledge base. If substituting exercises, explain why and ensure the substitute targets the same muscle group.`
      }
    });
    
    console.log('\n=== EMERGENCY FIXES APPLIED ===');
    console.log('✅ RAG Similarity Threshold: 0.05 (much lower for better retrieval)');
    console.log('✅ RAG High Relevance Threshold: 0.3 (lower for comprehensive search)');
    console.log('✅ RAG Max Chunks: 12 (more context)');
    console.log('✅ Max Tokens: 8192 (better responses)');
    console.log('✅ Models: Updated to latest versions');
    console.log('✅ System Prompt: CRITICAL enforcement added');
    console.log('✅ Exercise Replacement Rules: Explicit prevention of nonsensical substitutions');
    console.log('✅ Knowledge Base: Enforced as single source of truth');
    
    console.log('\n🎯 CRITICAL FIXES FOR TERRIBLE RESPONSES:');
    console.log('1. ❌ PREVENTED: "chest press" substitution for leg exercises');
    console.log('2. ✅ ENFORCED: Only KB exercises for workout programming');
    console.log('3. ✅ ENFORCED: Proper exercise-to-muscle matching');
    console.log('4. ✅ ENFORCED: Clear statements when KB lacks specific exercises');
    console.log('5. ✅ ENFORCED: Validation checkpoint before providing workouts');
    
    console.log('\n🚀 AI should now provide accurate, sensible responses!');
    console.log('⚠️  Test immediately with leg workout request to verify fix');
    
  } catch (error) {
    console.error('❌ Emergency fix failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

emergencyConfigFix().catch(console.error);
