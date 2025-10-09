/**
 * Comparison Example: LLM Function Calling vs Regex Extraction
 * 
 * This example demonstrates the key differences between the old regex-based
 * approach and the new LLM function calling approach for information extraction.
 */

// Example user message
const complexUserMessage = `
Hi there! I'm Sarah, 26 years old, and I'm really excited to start my fitness journey with you. 
I currently weigh 58kg and I'm about 165cm tall. I've been pretty sedentary for the past few years 
due to my desk job in software development, but I'm ready to change that!

My main goal is to build some muscle and get stronger - I feel like I have noodle arms right now 😅
I'd also love to lose a bit of body fat and just feel more confident in my own skin. I'm hoping 
to reach maybe 55kg but with more muscle mass, if that makes sense?

I just got a gym membership at the local fitness center, and they have all the basic equipment - 
barbells, dumbbells, machines, the works. I'm planning to train 3-4 times per week, probably 
in the evenings after work since I'm definitely not a morning person!

One thing I should mention - I had a minor wrist injury from snowboarding last winter. It's mostly 
healed now but sometimes gets a bit sore with certain movements. Also, I'm vegetarian and have 
been for about 5 years now, so I'll need some help with protein sources.

I usually get about 6-7 hours of sleep (I know, not ideal) and my stress levels are pretty moderate 
- work can be demanding but I try to manage it with some meditation apps.

Looking forward to working together!
`;

console.log("🔍 COMPARISON: LLM Function Calling vs Regex Extraction");
console.log("=".repeat(80));
console.log();
console.log("📝 User Message:");
console.log(complexUserMessage);
console.log();

// What the OLD regex-based system would extract
console.log("🤖 OLD APPROACH - Regex Pattern Matching:");
console.log("=".repeat(50));

const regexExtractions = {
  name: "Sarah", // Would match: /(?:i'm|i am|call me)\s+([a-z]+)/i
  age: 26,       // Would match: /(?:i'm|i am|age|old)\s*(\d{1,2})/i
  weight: 58,    // Would match: /(\d+(?:\.\d+)?)\s*(?:kg|kilos?)/i
  height: 165,   // Would match: /(\d+(?:\.\d+)?)\s*(?:cm|centimeters?)/i
  weeklyTrainingDays: null, // ❌ "3-4 times per week" wouldn't match /(\d+)\s*(?:days?\s*(?:per\s*week|weekly))/i
  primaryGoal: null,        // ❌ "build muscle and get stronger" is too complex for simple pattern
  gymAccess: true,          // Would match: /gym membership|go to gym/
  injuries: null,           // ❌ "wrist injury from snowboarding" too complex for simple patterns
  dietaryPreferences: null, // ❌ "vegetarian" pattern not included in basic regex
  sleepHours: null,         // ❌ "6-7 hours" range not handled by /(\d+)\s*(?:hours?\s*(?:of\s*)?sleep)/i
  targetWeight: null,       // ❌ "maybe 55kg" with uncertainty not captured
};

console.log("✅ Successfully extracted:");
Object.entries(regexExtractions).forEach(([key, value]) => {
  if (value !== null) {
    console.log(`  - ${key}: ${value}`);
  }
});

console.log("\n❌ Failed to extract:");
Object.entries(regexExtractions).forEach(([key, value]) => {
  if (value === null) {
    console.log(`  - ${key}: Too complex for regex patterns`);
  }
});

console.log("\n🧠 NEW APPROACH - LLM Function Calling:");
console.log("=".repeat(50));

const llmExtractions = {
  name: "Sarah",
  age: 26,
  height: 165,
  weight: 58,
  targetWeight: 55,
  primaryGoal: "muscle_gain", // ✅ Understands "build muscle and get stronger"
  weeklyTrainingDays: 3.5,    // ✅ Handles "3-4 times per week" intelligently
  trainingSchedule: "evenings after work", // ✅ Captures scheduling preferences
  gymAccess: true,
  equipmentAvailable: ["barbells", "dumbbells", "machines"], // ✅ Detailed equipment list
  injuries: ["wrist"],        // ✅ Identifies injury type and context
  limitations: ["minor wrist sensitivity"], // ✅ Captures nuanced limitations
  dietaryPreferences: ["vegetarian"], // ✅ Dietary information
  sleepHours: 6.5,           // ✅ Handles range "6-7 hours" intelligently
  stressLevel: "moderate",   // ✅ Qualitative assessment
  workSchedule: "desk job in software development", // ✅ Context about lifestyle
  motivation: "feel more confident, build strength", // ✅ Personal motivation
  trainingExperience: "beginner", // ✅ Inferred from context
  communicationStyle: "friendly and enthusiastic", // ✅ Communication preferences
  preferredLanguage: "en"    // ✅ Detected from message
};

console.log("✅ Successfully extracted:");
Object.entries(llmExtractions).forEach(([key, value]) => {
  console.log(`  - ${key}: ${Array.isArray(value) ? value.join(', ') : value}`);
});

console.log("\n📊 COMPARISON SUMMARY:");
console.log("=".repeat(30));
console.log(`Regex extracted: ${Object.values(regexExtractions).filter(v => v !== null).length} fields`);
console.log(`LLM extracted: ${Object.keys(llmExtractions).length} fields`);
console.log(`Improvement: ${Math.round((Object.keys(llmExtractions).length / Object.values(regexExtractions).filter(v => v !== null).length - 1) * 100)}% more data extracted`);

console.log("\n🎯 KEY ADVANTAGES OF LLM APPROACH:");
console.log("=".repeat(40));
console.log("1. 🧠 Context Understanding: Handles complex, natural language");
console.log("2. 🔄 Range Handling: Processes '3-4 times' or '6-7 hours' intelligently");
console.log("3. 🎨 Inference: Derives experience level from context clues");
console.log("4. 🌍 Comprehensive: Extracts nuanced information like motivation");
console.log("5. 🛡️ Robust: Works with various phrasings and sentence structures");
console.log("6. 🚀 Extensible: Easily add new fields without coding new patterns");
console.log("7. 🎯 Accurate: Understands intent rather than matching patterns");

console.log("\n✨ REAL-WORLD IMPACT:");
console.log("=".repeat(25));
console.log("• Better personalization from richer user profiles");
console.log("• More natural conversation flow");
console.log("• Reduced user frustration from rigid input requirements");
console.log("• Enhanced coaching quality through comprehensive data");
console.log("• Future-proof architecture for new data types");

console.log("\n" + "=".repeat(80));
console.log("🎉 This is why LLM Function Calling is a game-changer for user experience!");
console.log("=".repeat(80));
