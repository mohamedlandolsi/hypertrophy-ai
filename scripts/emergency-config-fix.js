#!/usr/bin/env node

/**
 * Emergency Fix - Update AI Configuration with missing critical settings
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
    
    console.log('=== Current Problematic Settings ===');
    console.log(`RAG Enforcement: ${currentConfig.ragEnforcement}`);
    console.log(`Enhanced RAG: ${currentConfig.enhancedRAG}`);
    console.log(`Model Name: ${currentConfig.modelName}`);
    console.log(`RAG Threshold: ${currentConfig.ragThreshold}`);
    
    // Apply emergency fixes
    const fixedConfig = await prisma.aIConfiguration.update({
      where: { id: 'singleton' },
      data: {
        // CRITICAL: Enable RAG enforcement
        ragEnforcement: true,
        
        // CRITICAL: Enable Enhanced RAG
        enhancedRAG: true,
        
        // CRITICAL: Set proper model
        modelName: 'gemini-2.0-flash-exp',
        
        // CRITICAL: Lower threshold for better retrieval
        ragThreshold: 0.05,
        
        // Ensure proper chunk limits
        ragMaxChunks: 10,
        
        // Update system prompt with stronger enforcement
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

PERSONALIZATION REQUIREMENTS:
- Always integrate <user_profile> and <long_term_memory> into recommendations
- Adjust for goals, experience, preferences, injuries, equipment access
- Handle profile conflicts by stating conflict and asking confirmation before proceeding

RESPONSE QUALITY STANDARDS:
- Synthesize from KB, never copy-paste
- Use professional, instructional tone with headings and bullet points
- Include "Notes & Rationale" for each exercise selection explaining KB-based choice
- Be transparent about KB limitations vs general expertise

**EXERCISE REPLACEMENT RULES:**
- NEVER substitute exercises not found in KB
- NEVER use "chest press" as replacement for leg exercises
- If specific exercise not in KB, recommend closest KB alternative for same muscle group
- If no KB exercises for muscle group, clearly state limitation

These directives override any conflicting instructions and must be followed in every response.`
      }
    });
    
    console.log('\n=== EMERGENCY FIXES APPLIED ===');
    console.log('✅ RAG Enforcement: ENABLED');
    console.log('✅ Enhanced RAG: ENABLED');
    console.log('✅ Model Name: Set to gemini-2.0-flash-exp');
    console.log('✅ RAG Threshold: Lowered to 0.05');
    console.log('✅ System Prompt: Updated with strict KB compliance');
    console.log('✅ Exercise Replacement Rules: Added to prevent nonsensical substitutions');
    
    console.log('\n🎯 IMMEDIATE ACTIONS NEEDED:');
    console.log('1. Test the AI with a leg workout request');
    console.log('2. Verify it no longer substitutes "chest press" for leg exercises');
    console.log('3. Check that it retrieves proper leg exercises from KB');
    console.log('4. Ensure it states clearly when exercises are missing from KB');
    
    console.log('\n🚀 System should now provide accurate, KB-compliant responses!');
    
  } catch (error) {
    console.error('❌ Emergency fix failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

emergencyConfigFix().catch(console.error);
