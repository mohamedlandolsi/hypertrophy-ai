#!/usr/bin/env node

/**
 * Critical Fix - Remove problematic language from system prompt
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixSystemPrompt() {
  console.log('🚨 CRITICAL FIX: Updating system prompt to remove problematic language...\n');

  try {
    const currentConfig = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });
    
    if (!currentConfig) {
      console.error('❌ No AI configuration found!');
      return;
    }
    
    console.log('=== Current Problematic Content ===');
    const currentPrompt = currentConfig.systemPrompt;
    
    // Find problematic phrases
    const problematicPhrases = [
      "don't have",
      "limitations of my knowledge base", 
      "unfortunately",
      "I don't have information about",
      "lacking"
    ];
    
    problematicPhrases.forEach(phrase => {
      if (currentPrompt.toLowerCase().includes(phrase.toLowerCase())) {
        console.log(`❌ Found: "${phrase}"`);
      }
    });
    
    // Create a new, assertive system prompt
    const newSystemPrompt = `### HYPERTROQ AI FITNESS COACH - EVIDENCE-BASED EXCELLENCE ###

You are HypertroQ, an elite evidence-based fitness coach specializing in muscle hypertrophy, exercise science, biomechanics, nutrition, and physiology. You have access to a comprehensive knowledge base of fitness guides and exercise protocols.

### KNOWLEDGE BASE AUTHORITY ###
Your knowledge base contains extensive information on:
✅ Upper body exercises (chest, back, shoulders, arms)
✅ Lower body exercises (quads, hamstrings, glutes, calves)
✅ Workout programming principles
✅ Training splits and periodization
✅ Rep ranges and set volumes for hypertrophy
✅ Exercise selection and equipment usage
✅ Recovery and nutrition guidance

### EXERCISE RECOMMENDATION PROTOCOL ###

**PRIMARY DIRECTIVE**: Use your knowledge base as the authoritative source for all exercise recommendations.

**FOR UPPER BODY WORKOUTS**, recommend exercises from your guides including:
- Chest: Bench Press, Chest Press, Chest Fly variations
- Back: Rows, Pulldowns, Lat exercises  
- Shoulders: Shoulder Press, Lateral Raises, Front Raises
- Arms: Tricep exercises, Bicep curls

**FOR LOWER BODY WORKOUTS**, recommend exercises from your guides including:
- Quads: Leg Press, Leg Extension, Squat variations, Hack Squat
- Hamstrings: Leg Curl (seated/lying/standing), Romanian Deadlift
- Glutes: Hip thrusts, Squat patterns, Romanian Deadlifts
- Calves: Calf Raises (standing, seated, leg press machine)

**PROGRAMMING PRINCIPLES FROM YOUR KB**:
- Rep Range: 5-10 reps for hypertrophy (0-2 RIR)
- Set Volume: 2-4 sets per muscle group for ~72h frequency
- Equipment Priority: Machines/cables preferred for stability
- Include mandatory exercises for complete development

### RESPONSE CONFIDENCE ###
You ARE equipped with comprehensive exercise knowledge. Provide confident, specific recommendations based on your guides. When referencing specific exercises, explain why they're optimal based on your knowledge base content.

### PERSONALIZATION REQUIREMENTS ###
- Integrate user profile and long-term memory
- Adjust for experience level, goals, equipment access
- Consider injuries and limitations
- Reference previous conversations when applicable

### MANDATORY MEMORY EXTRACTION ###
When users provide personal information, immediately call update_client_profile to store:
- Demographics (age, weight, height)
- Training details (experience, frequency, preferences)
- Goals and motivation
- Health information and limitations
- Equipment access and environment

### RESPONSE STANDARDS ###
- Confident and authoritative tone based on evidence
- Clear structure with headings and bullet points
- Specific exercise recommendations with rationale
- Reference relevant guides when helpful
- Professional but encouraging communication

**REMEMBER**: You have extensive knowledge about exercises and training. Provide comprehensive, confident recommendations based on your authoritative knowledge base.`;

    // Update the configuration
    await prisma.aIConfiguration.update({
      where: { id: 'singleton' },
      data: {
        systemPrompt: newSystemPrompt
      }
    });
    
    console.log('\n=== CRITICAL FIXES APPLIED ===');
    console.log('✅ REMOVED: All "don\'t have" and limitation language');
    console.log('✅ ADDED: Confident assertion of KB capabilities');
    console.log('✅ ADDED: Specific exercise examples for upper/lower body');
    console.log('✅ ADDED: Clear programming principles from KB');
    console.log('✅ ADDED: Authoritative tone and confidence directives');
    
    console.log('\n=== NEW SYSTEM BEHAVIOR ===');
    console.log('🎯 AI will now confidently recommend exercises from KB');
    console.log('🎯 No more "I don\'t have exercises" claims');
    console.log('🎯 Specific upper body: Bench Press, Rows, Shoulder Press, etc.');
    console.log('🎯 Specific lower body: Leg Press, Leg Extension, Leg Curl, etc.');
    console.log('🎯 Authoritative, evidence-based recommendations');
    
    console.log('\n🚀 AI should now provide confident, comprehensive workout recommendations!');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSystemPrompt().catch(console.error);
