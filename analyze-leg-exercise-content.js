const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeLegExerciseContent() {
  try {
    console.log('🦵 Analyzing Leg Exercise Content in Knowledge Base...\n');
    
    // Search for leg-specific exercise content
    const legExerciseContent = await prisma.knowledgeChunk.findMany({
      where: {
        OR: [
          { content: { contains: 'squat', mode: 'insensitive' } },
          { content: { contains: 'deadlift', mode: 'insensitive' } },
          { content: { contains: 'leg press', mode: 'insensitive' } },
          { content: { contains: 'leg curl', mode: 'insensitive' } },
          { content: { contains: 'leg extension', mode: 'insensitive' } },
          { content: { contains: 'lunge', mode: 'insensitive' } },
          { content: { contains: 'hip thrust', mode: 'insensitive' } },
          { content: { contains: 'calf raise', mode: 'insensitive' } },
          { content: { contains: 'lower body', mode: 'insensitive' } },
          { content: { contains: 'quad', mode: 'insensitive' } },
          { content: { contains: 'hamstring', mode: 'insensitive' } },
          { content: { contains: 'glute', mode: 'insensitive' } }
        ]
      },
      include: {
        knowledgeItem: { select: { title: true } }
      },
      take: 20
    });
    
    console.log(`📚 Found ${legExerciseContent.length} leg exercise chunks:`);
    
    const exerciseGuides = new Map();
    
    legExerciseContent.forEach(chunk => {
      const title = chunk.knowledgeItem.title;
      if (!exerciseGuides.has(title)) {
        exerciseGuides.set(title, []);
      }
      exerciseGuides.get(title).push(chunk);
    });
    
    console.log(`\n📖 Leg exercise guides found:`);
    Array.from(exerciseGuides.keys()).forEach(title => {
      const chunks = exerciseGuides.get(title);
      console.log(`- ${title} (${chunks.length} chunks)`);
    });
    
    // Analyze each guide's content for exercise specifics
    console.log('\n🔍 Detailed Exercise Analysis:');
    
    for (const [title, chunks] of exerciseGuides) {
      console.log(`\n📖 ${title}:`);
      
      let hasSquatInfo = false;
      let hasDeadliftInfo = false;
      let hasAccessoryInfo = false;
      let hasSpecificSets = false;
      
      chunks.forEach((chunk, i) => {
        const content = chunk.content.toLowerCase();
        
        if (content.includes('squat') && (content.includes('leg press') || content.includes('hack squat') || content.includes('pendulum'))) {
          hasSquatInfo = true;
        }
        
        if (content.includes('deadlift') || content.includes('rdl') || content.includes('stiff leg')) {
          hasDeadliftInfo = true;
        }
        
        if (content.includes('leg curl') || content.includes('leg extension') || content.includes('calf raise')) {
          hasAccessoryInfo = true;
        }
        
        if (content.includes('2 sets') || content.includes('3 sets') || content.includes('2-3') || content.includes('1-2')) {
          hasSpecificSets = true;
        }
        
        // Show first few chunks
        if (i < 3) {
          console.log(`   Chunk ${i + 1}: ${chunk.content.substring(0, 120)}...`);
        }
      });
      
      console.log(`   Analysis:`);
      console.log(`   - Squat exercises: ${hasSquatInfo ? '✅' : '❌'}`);
      console.log(`   - Deadlift exercises: ${hasDeadliftInfo ? '✅' : '❌'}`);
      console.log(`   - Accessory exercises: ${hasAccessoryInfo ? '✅' : '❌'}`);
      console.log(`   - Specific set guidance: ${hasSpecificSets ? '✅' : '❌'}`);
    }
    
    // Check if there's a comprehensive lower body workout guide
    const lowerBodyGuide = await prisma.knowledgeItem.findFirst({
      where: {
        title: { contains: 'Lower Body Workout', mode: 'insensitive' }
      },
      include: { chunks: true }
    });
    
    if (lowerBodyGuide) {
      console.log(`\n🎯 Found comprehensive guide: "${lowerBodyGuide.title}"`);
      console.log(`   Chunks: ${lowerBodyGuide.chunks.length}`);
      
      // Analyze this guide specifically
      let completeWorkoutInfo = {
        hasSquatPattern: false,
        hasHingePattern: false,
        hasQuadIsolation: false,
        hasHamstringIsolation: false,
        hasGluteIsolation: false,
        hasCalfWork: false,
        hasSetGuidance: false,
        hasExerciseNames: false
      };
      
      lowerBodyGuide.chunks.forEach(chunk => {
        const content = chunk.content.toLowerCase();
        
        if (content.includes('squat') && (content.includes('pattern') || content.includes('leg press') || content.includes('hack'))) {
          completeWorkoutInfo.hasSquatPattern = true;
        }
        
        if (content.includes('hinge') || content.includes('deadlift') || content.includes('rdl')) {
          completeWorkoutInfo.hasHingePattern = true;
        }
        
        if (content.includes('quadriceps') || content.includes('leg extension')) {
          completeWorkoutInfo.hasQuadIsolation = true;
        }
        
        if (content.includes('hamstring') || content.includes('leg curl')) {
          completeWorkoutInfo.hasHamstringIsolation = true;
        }
        
        if (content.includes('glute') || content.includes('hip thrust')) {
          completeWorkoutInfo.hasGluteIsolation = true;
        }
        
        if (content.includes('calf') || content.includes('calf raise')) {
          completeWorkoutInfo.hasCalfWork = true;
        }
        
        if (content.includes('2 sets') || content.includes('3 sets') || content.includes('2-3 sets')) {
          completeWorkoutInfo.hasSetGuidance = true;
        }
        
        if (content.includes('leg press') || content.includes('hack squat') || content.includes('seated leg curl')) {
          completeWorkoutInfo.hasExerciseNames = true;
        }
      });
      
      console.log('\n   Complete workout coverage:');
      Object.entries(completeWorkoutInfo).forEach(([key, value]) => {
        console.log(`   - ${key}: ${value ? '✅' : '❌'}`);
      });
      
      const completenessScore = Object.values(completeWorkoutInfo).filter(v => v).length;
      console.log(`\n   📊 Completeness: ${completenessScore}/8 components`);
      
      if (completenessScore >= 6) {
        console.log('   ✅ Guide has comprehensive lower body workout information');
      } else {
        console.log('   ❌ Guide missing key workout components');
      }
    } else {
      console.log('\n❌ No comprehensive lower body workout guide found');
    }
    
    // Recommendations
    console.log('\n📋 Recommendations for Complete Leg Workouts:');
    console.log('1. Ensure lower body guide includes specific exercise names');
    console.log('2. Add set/rep guidance to exercise selections');
    console.log('3. Include both compound and isolation exercises');
    console.log('4. Verify programming guides are being retrieved together');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeLegExerciseContent();
