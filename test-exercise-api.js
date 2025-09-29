// Test the exercise API endpoint
async function testExerciseAPI() {
  const testMuscleGroups = ['CHEST', 'BACK', 'SHOULDERS', 'ARMS', 'LEGS'];
  
  console.log('🧪 Testing Exercise API endpoints...\n');
  
  for (const muscleGroup of testMuscleGroups) {
    try {
      console.log(`Testing ${muscleGroup}...`);
      const response = await fetch(`http://localhost:3000/api/exercises/by-muscle-group?muscleGroup=${muscleGroup}`);
      
      if (!response.ok) {
        console.log(`❌ ${muscleGroup}: HTTP ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      console.log(`✅ ${muscleGroup}: ${data.exercises?.length || 0} exercises`);
      
      if (data.exercises?.length > 0) {
        const exercise = data.exercises[0];
        console.log(`   Sample: ${exercise.name} (${exercise.difficulty})`);
      }
    } catch (error) {
      console.log(`❌ ${muscleGroup}: ${error.message}`);
    }
    console.log('');
  }
}

// Run the test
testExerciseAPI().catch(console.error);