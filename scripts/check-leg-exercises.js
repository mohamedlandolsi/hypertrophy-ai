#!/usr/bin/env node

/**
 * Quick check - What leg exercises are actually in the knowledge base?
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkLegExercises() {
  console.log('🔍 Checking what leg exercises are actually in the knowledge base...\n');

  try {
    // Search for specific leg exercise terms
    const legExerciseTerms = [
      'leg press',
      'squat',
      'leg extension', 
      'leg curl',
      'hack squat',
      'lunge',
      'quadriceps',
      'hamstring',
      'glute',
      'calf raise',
      'romanian deadlift',
      'stiff leg deadlift'
    ];
    
    for (const term of legExerciseTerms) {
      const chunks = await prisma.knowledgeChunk.findMany({
        where: {
          content: {
            contains: term,
            mode: 'insensitive'
          }
        },
        include: {
          knowledgeItem: {
            select: { title: true }
          }
        },
        take: 3
      });
      
      if (chunks.length > 0) {
        console.log(`✅ "${term}" found in ${chunks.length} chunks:`);
        chunks.forEach((chunk, i) => {
          console.log(`   ${i+1}. ${chunk.knowledgeItem.title}`);
          
          // Extract exercise mentions from content
          const content = chunk.content.toLowerCase();
          const exercisePattern = new RegExp(`[^.]*${term}[^.]*`, 'gi');
          const matches = chunk.content.match(exercisePattern);
          
          if (matches && matches.length > 0) {
            matches.slice(0, 2).forEach(match => {
              console.log(`      - ${match.trim().substring(0, 100)}...`);
            });
          }
        });
        console.log('');
      } else {
        console.log(`❌ "${term}" not found in knowledge base`);
      }
    }
    
    // Check for lower body workout guides specifically
    console.log('=== Lower Body Workout Guides ===');
    const lowerBodyGuides = await prisma.knowledgeItem.findMany({
      where: {
        OR: [
          { title: { contains: 'lower body', mode: 'insensitive' } },
          { title: { contains: 'leg', mode: 'insensitive' } },
          { title: { contains: 'squat', mode: 'insensitive' } },
          { title: { contains: 'quad', mode: 'insensitive' } },
          { title: { contains: 'hamstring', mode: 'insensitive' } }
        ]
      }
    });
    
    if (lowerBodyGuides.length > 0) {
      console.log(`✅ Found ${lowerBodyGuides.length} lower body related guides:`);
      lowerBodyGuides.forEach((guide, i) => {
        console.log(`   ${i+1}. ${guide.title}`);
      });
    } else {
      console.log('❌ No specific lower body workout guides found');
    }
    
    console.log('\n=== ANALYSIS ===');
    console.log('Based on this search, the AI should be able to recommend:');
    console.log('- Exercises found in the knowledge base content');
    console.log('- Should NOT substitute unrelated exercises');
    console.log('- Should clearly state if specific exercises are missing');
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLegExercises().catch(console.error);
