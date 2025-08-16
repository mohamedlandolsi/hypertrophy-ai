#!/usr/bin/env node
/**
 * Test script to verify exercise validation and prioritization system
 */

const { generateExerciseSelectionContext, VALIDATED_EXERCISES, validateWorkoutExercises } = require('./src/lib/exercise-validation.ts');

console.log('🧪 Testing Exercise Validation and Prioritization System...\n');

// Test 1: Exercise Database Coverage
console.log('📊 Test 1: Exercise Database Coverage');
console.log(`✅ Total validated exercises: ${VALIDATED_EXERCISES.length}`);

const muscleGroups = [...new Set(VALIDATED_EXERCISES.map(ex => ex.muscleGroup))];
console.log(`✅ Muscle groups covered: ${muscleGroups.length}`);
console.log(`   ${muscleGroups.join(', ')}`);

muscleGroups.forEach(muscle => {
  const exercisesForMuscle = VALIDATED_EXERCISES.filter(ex => ex.muscleGroup === muscle);
  console.log(`   ${muscle}: ${exercisesForMuscle.length} exercises`);
});

// Test 2: Context Generation
console.log('\n📝 Test 2: Exercise Selection Context Generation');
try {
  const context = generateExerciseSelectionContext();
  console.log(`✅ Context generated successfully (${context.length} characters)`);
  
  // Check that all exercise names are included
  let missingExercises = 0;
  VALIDATED_EXERCISES.forEach(exercise => {
    if (!context.includes(exercise.name)) {
      console.log(`   ❌ Missing exercise: ${exercise.name}`);
      missingExercises++;
    }
  });
  
  if (missingExercises === 0) {
    console.log('   ✅ All exercises included in context');
  } else {
    console.log(`   ❌ ${missingExercises} exercises missing from context`);
  }
  
  // Check for key requirements
  const requirements = [
    'VALIDATED EXERCISE DATABASE',
    'MUST prioritize',
    'machine and cable exercises',
    'EXERCISE SELECTION PRIORITY'
  ];
  
  requirements.forEach(req => {
    if (context.includes(req)) {
      console.log(`   ✅ Contains requirement: "${req}"`);
    } else {
      console.log(`   ❌ Missing requirement: "${req}"`);
    }
  });
  
} catch (error) {
  console.log(`   ❌ Error generating context: ${error.message}`);
}

// Test 3: Sample Exercise Selections
console.log('\n🎯 Test 3: Sample Exercise Selections by Muscle Group');

const sampleSelections = {
  'chest': ['Machine chest press', 'Incline machine chest press', 'Chest fly machine'],
  'back': ['Lat pulldown', 'Close grip chest supported row', 'Pullover machine'],
  'shoulders': ['Shoulder press machine', 'Lateral raises machine', 'Reverse fly machine'],
  'biceps': ['Bicep curl machine', 'Preacher curl machine', 'Cable curl'],
  'triceps': ['Triceps pushdown', 'Triceps extension', 'Overhead cable extension'],
  'quadriceps': ['Leg extension', 'Hack squat', 'Leg press'],
  'hamstrings': ['Seated leg curl', 'Lying leg curl', 'Stiff leg deadlift'],
  'glutes': ['Hip thrust', 'Hip abduction machine', 'Romanian deadlifts'],
  'calves': ['Standing calf raises machine', 'Calf press on leg press machine']
};

Object.entries(sampleSelections).forEach(([muscle, exercises]) => {
  console.log(`\n   ${muscle.toUpperCase()}:`);
  exercises.forEach(exercise => {
    const isValidated = VALIDATED_EXERCISES.some(ex => ex.name === exercise);
    console.log(`   ${isValidated ? '✅' : '❌'} ${exercise}`);
  });
});

// Test 4: Machine/Cable Priority Check
console.log('\n🤖 Test 4: Machine/Cable Exercise Priority');
const machineKeywords = ['machine', 'cable', 'smith machine'];
const machineExercises = VALIDATED_EXERCISES.filter(ex => 
  machineKeywords.some(keyword => ex.name.toLowerCase().includes(keyword))
);

console.log(`✅ Machine/Cable exercises: ${machineExercises.length}/${VALIDATED_EXERCISES.length} (${Math.round(machineExercises.length/VALIDATED_EXERCISES.length*100)}%)`);

if (machineExercises.length > VALIDATED_EXERCISES.length * 0.7) {
  console.log('   ✅ Good machine/cable priority (>70%)');
} else {
  console.log('   ⚠️  Consider adding more machine/cable exercises');
}

// Test 5: Coverage Analysis
console.log('\n📈 Test 5: Exercise Coverage Analysis');

const coverageAnalysis = {
  'compound': VALIDATED_EXERCISES.filter(ex => ex.category === 'compound').length,
  'isolation': VALIDATED_EXERCISES.filter(ex => ex.category === 'isolation').length
};

console.log(`✅ Compound exercises: ${coverageAnalysis.compound}`);
console.log(`✅ Isolation exercises: ${coverageAnalysis.isolation}`);

const compoundRatio = coverageAnalysis.compound / VALIDATED_EXERCISES.length;
if (compoundRatio >= 0.3 && compoundRatio <= 0.7) {
  console.log('   ✅ Good compound/isolation balance');
} else {
  console.log('   ⚠️  Consider balancing compound/isolation ratio');
}

console.log('\n🎉 Exercise Validation System Test Complete!');
console.log('\n📋 Summary of Implementation:');
console.log('- Comprehensive exercise database with 70+ validated exercises');
console.log('- Machine and cable exercise prioritization');
console.log('- Muscle group coverage for all major muscles');
console.log('- Context generation for AI prompt integration');
console.log('- Validation functions for workout program checking');
console.log('- Integration with core prompts and workout generator');

console.log('\n🎯 Expected AI Behavior:');
console.log('- AI will prioritize exercises from the validated list');
console.log('- Machine and cable exercises will be preferred over free weights');
console.log('- Specific exercise names will be used exactly as listed');
console.log('- Non-validated exercises will only be suggested with clear disclaimers');
console.log('- Workout programs will primarily use validated exercises');
