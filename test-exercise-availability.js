// Test exercise availability analysis fix
console.log('🧪 Testing Exercise Availability Analysis Fix\n');

// Mock knowledge context with various exercises
const mockKnowledgeContext = [
  { 
    content: 'Barbell bench press is excellent for chest development. Focus on proper form.',
    score: 0.95,
    title: 'Chest Training Guide'
  },
  { 
    content: 'Barbell rows are a fundamental back exercise. Pull-ups also target the lats effectively.',
    score: 0.88,
    title: 'Back Training Fundamentals'
  },
  { 
    content: 'Squats are the king of leg exercises. Deadlifts work hamstrings and glutes.',
    score: 0.92,
    title: 'Lower Body Development'
  },
  { 
    content: 'Overhead press builds shoulder strength. Lateral raises target side delts.',
    score: 0.85,
    title: 'Shoulder Training'
  },
  { 
    content: 'Bicep curls and tricep extensions are essential for arm development.',
    score: 0.78,
    title: 'Arm Specialization'
  }
];

// Exercise patterns (simplified)
const EXERCISE_PATTERNS = [
  /\b(?:squat|deadlift|chest press|row|pull-up|push-up|lunge|curl|press|extension|fly|raise|hip|thrust|adduction|abduction|pushdown|machine)\b/gi,
  /\b(?:barbell|dumbbell|cable|machine|bodyweight)\s+\w+/gi,
  /\b\w+\s+(?:squat|deadlift|chest press|row|curl|extension|fly|raise)\b/gi,
];

// Mock the analysis function
function analyzeKnowledgeBaseExercises(knowledgeContext) {
  if (knowledgeContext.length === 0) {
    return "\n<exercise_availability>\nNo exercise information currently available in knowledge base.\n</exercise_availability>\n";
  }

  const muscleGroups = {
    chest: ['chest', 'pec', 'bench'],
    back: ['back', 'lat', 'row', 'pull'],
    legs: ['leg', 'squat', 'deadlift', 'quad', 'hamstring', 'glute', 'calf'],
    shoulders: ['shoulder', 'delt', 'press', 'raise'],
    arms: ['arm', 'bicep', 'tricep', 'curl', 'extension'],
    core: ['core', 'abs', 'abdominal', 'plank']
  };

  const availableExercisesByGroup = {};
  
  // Initialize all muscle groups
  Object.keys(muscleGroups).forEach(group => {
    availableExercisesByGroup[group] = new Set();
  });

  // Extract exercises from KB and categorize by muscle group
  for (const chunk of knowledgeContext) {
    for (const pattern of EXERCISE_PATTERNS) {
      const matches = chunk.content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const exerciseName = match.toLowerCase().trim();
          
          // Categorize exercise by muscle group
          for (const [group, keywords] of Object.entries(muscleGroups)) {
            if (keywords.some(keyword => 
              exerciseName.includes(keyword) || 
              chunk.content.toLowerCase().includes(keyword) ||
              chunk.title.toLowerCase().includes(keyword)
            )) {
              availableExercisesByGroup[group].add(exerciseName);
            }
          }
        });
      }
    }
  }

  // Build summary for the AI
  let summary = "\n<exercise_availability>\n";
  summary += "Available exercises in your knowledge base by muscle group:\n";
  
  Object.entries(availableExercisesByGroup).forEach(([group, exercises]) => {
    const exerciseList = Array.from(exercises);
    if (exerciseList.length > 0) {
      summary += `\n${group.toUpperCase()}: ${exerciseList.length} exercises available\n`;
      summary += `Examples: ${exerciseList.slice(0, 3).join(', ')}${exerciseList.length > 3 ? ', and more...' : ''}\n`;
    } else {
      summary += `\n${group.toUpperCase()}: No specific exercises found\n`;
    }
  });
  
  summary += "\nIMPORTANT: Only state limitations for muscle groups that truly have NO exercises listed above.\n";
  summary += "</exercise_availability>\n";
  
  return summary;
}

// Test the function
console.log('📊 Testing with mock KB containing various exercises:');
console.log('─'.repeat(80));
const result = analyzeKnowledgeBaseExercises(mockKnowledgeContext);
console.log(result);
console.log('─'.repeat(80));

console.log('\n📊 Testing with empty KB:');
console.log('─'.repeat(80));
const emptyResult = analyzeKnowledgeBaseExercises([]);
console.log(emptyResult);
console.log('─'.repeat(80));

console.log('\n✅ Exercise availability analysis test complete!');
console.log('\n📋 Expected Benefits:');
console.log('   ✅ AI will see which muscle groups have exercises available');
console.log('   ✅ Will only state limitations for groups that truly lack exercises');
console.log('   ✅ Prevents false claims about missing exercises');
console.log('   ✅ Provides specific examples to guide AI recommendations');
