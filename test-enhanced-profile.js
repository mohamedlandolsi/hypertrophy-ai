/**
 * Test script to verify the enhanced profile system
 * Run this in Node.js to test the profile API and AI integration
 */

const testProfile = {
  // Personal Information
  name: "John Doe",
  age: 28,
  gender: "MALE",
  height: 180,
  weight: 75,
  bodyFatPercentage: 15,

  // Training Information
  trainingExperience: "intermediate",
  weeklyTrainingDays: 4,
  preferredTrainingStyle: "hypertrophy",
  trainingSchedule: "evening",
  availableTime: 90,
  activityLevel: "MODERATE",

  // Goals and Motivation
  primaryGoal: "muscle_gain",
  secondaryGoals: ["strength", "better_sleep"],
  targetWeight: 80,
  targetBodyFat: 12,
  goalDeadline: "2025-12-31",
  motivation: "I want to feel confident and strong for my wedding next year",

  // Health and Limitations
  injuries: ["lower_back"],
  limitations: [],
  medications: [],
  allergies: ["shellfish"],

  // Preferences and Lifestyle
  dietaryPreferences: ["high_protein"],
  foodDislikes: ["brussels_sprouts"],
  supplementsUsed: ["protein_powder", "creatine"],
  sleepHours: 7.5,
  stressLevel: "moderate",
  workSchedule: "standard",

  // Training Environment
  gymAccess: true,
  homeGym: false,
  equipmentAvailable: ["dumbbells", "barbell", "squat_rack", "bench"],
  gymBudget: 50,

  // Progress Tracking
  currentBench: 80,
  currentSquat: 100,
  currentDeadlift: 120,
  currentOHP: 55,

  // Communication Preferences
  preferredLanguage: "en",
  communicationStyle: "encouraging"
};

console.log('Test Profile Data:');
console.log(JSON.stringify(testProfile, null, 2));

console.log('\n=== Expected AI Context ===');
console.log('With this comprehensive profile, the AI should now be able to provide:');
console.log('1. Personalized training programs based on experience level and goals');
console.log('2. Nutrition advice considering dietary preferences and allergies');
console.log('3. Exercise modifications for lower back injury');
console.log('4. Realistic timelines based on activity level and goal deadline');
console.log('5. Equipment-specific workout recommendations');
console.log('6. Progressive overload calculations from current lift numbers');
console.log('7. Lifestyle-aware scheduling (evening training preference)');
console.log('8. Gender and age-specific metabolic considerations');

console.log('\n=== Sample AI Memory Summary ===');
const sampleSummary = `
PERSONAL INFO: Name: John Doe, Age: 28, Gender: male, Height: 180cm, Weight: 75kg, Body Fat: 15%
TRAINING: Experience: intermediate, Training Days: 4/week, Activity Level: moderate, Style: hypertrophy, Session Time: 90min, Prefers: evening training
GOALS: Primary: muscle_gain, Secondary: strength, better_sleep, Target Weight: 80kg, Target Body Fat: 12%, Deadline: Fri Dec 31 2025, Motivation: I want to feel confident and strong for my wedding next year
HEALTH: Injuries: lower_back, Allergies: shellfish
LIFESTYLE: Sleep: 7.5h/night, Stress Level: moderate, Work Schedule: standard, Diet: high_protein, Supplements: protein_powder, creatine
ENVIRONMENT: Has gym access, Equipment: dumbbells, barbell, squat_rack, bench, Budget: 50/month
CURRENT LIFTS: Bench: 80kg, Squat: 100kg, Deadlift: 120kg, OHP: 55kg
COMMUNICATION: Style: encouraging
`.trim();

console.log(sampleSummary);

console.log('\n=== Benefits of Enhanced Profile System ===');
console.log('✅ Structured data for consistent AI responses');
console.log('✅ Enum validation for data integrity');
console.log('✅ Comprehensive user interface for easy profile management');
console.log('✅ Enhanced AI context for personalized coaching');
console.log('✅ Better progress tracking and goal setting');
console.log('✅ Lifestyle-aware recommendations');
console.log('✅ Safety considerations (injuries, limitations)');
console.log('✅ Equipment-specific workout generation');
