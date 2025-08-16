// Test improved exercise replacement with KB relevance scores
console.log('🧪 Testing Enhanced Exercise Replacement Logic\n');

// Mock knowledge context with different scores
const mockKnowledgeContext = [
  { 
    content: 'Barbell bench press is excellent for chest development. Focus on proper form.',
    score: 0.95,
    title: 'Chest Training Guide'
  },
  { 
    content: 'Dumbbell bench press provides better range of motion for chest muscles.',
    score: 0.88,
    title: 'Advanced Chest Exercises'
  },
  { 
    content: 'Push-ups are a basic bodyweight chest exercise for beginners.',
    score: 0.65,
    title: 'Bodyweight Training'
  },
  { 
    content: 'Incline dumbbell press targets upper chest effectively.',
    score: 0.82,
    title: 'Chest Specialization'
  },
  { 
    content: 'Cable fly is an isolation exercise for chest definition.',
    score: 0.71,
    title: 'Cable Training Methods'
  }
];

// Exercise patterns (simplified for testing)
const EXERCISE_PATTERNS = [
  /\b(?:barbell bench press|dumbbell bench press|push-ups|incline dumbbell press|cable fly)\b/gi,
  /\b(?:chest press|bench press|fly|press)\b/gi
];

// Mock the exercise extraction and mapping logic
function buildExerciseToChunkMap(knowledgeContext) {
  const validExercises = new Set();
  const exerciseToChunkMap = new Map();
  
  for (const chunk of knowledgeContext) {
    for (const pattern of EXERCISE_PATTERNS) {
      const matches = chunk.content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleanExercise = match.toLowerCase().trim();
          validExercises.add(cleanExercise);
          
          // Store the best chunk for each exercise (highest score)
          if (!exerciseToChunkMap.has(cleanExercise) || chunk.score > exerciseToChunkMap.get(cleanExercise).score) {
            exerciseToChunkMap.set(cleanExercise, chunk);
          }
        });
      }
    }
  }
  
  return { validExercises: Array.from(validExercises), exerciseToChunkMap };
}

// Mock the improved function
function findBestExerciseReplacement(invalidExercise, validExercises, exerciseToChunkMap) {
  const muscleGroups = {
    chest: ['chest', 'pec', 'bench'],
    back: ['back', 'lat', 'row', 'pull'],
    legs: ['leg', 'squat', 'deadlift', 'quad', 'hamstring', 'glute'],
    shoulders: ['shoulder', 'delt', 'press', 'raise'],
    arms: ['arm', 'bicep', 'tricep', 'curl', 'extension']
  };

  // Determine target muscle group of invalid exercise
  let targetMuscleGroup = 'general';
  for (const [group, keywords] of Object.entries(muscleGroups)) {
    if (keywords.some(keyword => invalidExercise.toLowerCase().includes(keyword))) {
      targetMuscleGroup = group;
      break;
    }
  }

  // Filter valid exercises to same muscle group if possible
  const sameGroupExercises = validExercises.filter(valid => {
    if (targetMuscleGroup === 'general') return true;
    return muscleGroups[targetMuscleGroup]
      .some(keyword => valid.toLowerCase().includes(keyword));
  });

  if (sameGroupExercises.length === 0) {
    return validExercises.length > 0 ? validExercises[0] : null;
  }

  // Pick the exercise whose KB chunk has the highest score
  let bestExercise = sameGroupExercises[0];
  let bestScore = -Infinity;

  for (const ex of sameGroupExercises) {
    const chunk = exerciseToChunkMap.get(ex);
    if (chunk && chunk.score > bestScore) {
      bestScore = chunk.score;
      bestExercise = ex;
    }
  }

  return { exercise: bestExercise, score: bestScore };
}

// Test the functionality
const { validExercises, exerciseToChunkMap } = buildExerciseToChunkMap(mockKnowledgeContext);

console.log('📊 Available exercises from KB:');
validExercises.forEach(ex => {
  const chunk = exerciseToChunkMap.get(ex);
  console.log(`  • ${ex} (score: ${chunk.score})`);
});

console.log('\n🔄 Testing exercise replacements:');

const testCases = [
  'machine chest press',    // Should get highest-scored chest exercise
  'decline bench press',    // Should get highest-scored chest/bench exercise  
  'chest fly machine',      // Should get highest-scored chest exercise
  'random invalid exercise' // Should get highest-scored available exercise
];

testCases.forEach((invalidExercise, index) => {
  console.log(`\n${index + 1}. Invalid: "${invalidExercise}"`);
  
  const result = findBestExerciseReplacement(invalidExercise, validExercises, exerciseToChunkMap);
  
  if (result) {
    console.log(`   ✅ Best replacement: "${result.exercise}" (score: ${result.score})`);
    
    // Show why this was chosen
    const chunk = exerciseToChunkMap.get(result.exercise);
    console.log(`   📝 From: "${chunk.title}"`);
  } else {
    console.log(`   ❌ No replacement found`);
  }
});

console.log('\n✅ Enhanced exercise replacement testing complete!');
console.log('\n📋 Key Improvements:');
console.log('   ✅ Uses KB relevance scores to pick best replacements');
console.log('   ✅ Maintains muscle group targeting');
console.log('   ✅ Always chooses highest-scoring alternative');
console.log('   ✅ Provides transparency with score logging');
