// Test file to demonstrate markdown rendering improvements
const sampleAIResponse = `Drawing from my general knowledge base, calculating precise calorie and macronutrient needs:

Here's a general approach:

• **Base Metabolic Rate (BMR)**: This is the number of calories your body burns at rest.
  - **Mifflin-St. Jeor Equation (commonly used):**
  - For Men: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5
  - For Women: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161

• **Total Daily Energy Expenditure (TDEE)**: This is your BMR adjusted for your activity level.
  - **Activity Multiplier:**
  - Sedentary (little or no exercise): BMR × 1.2
  - Lightly active (light exercise/sports 1-3 days/week): BMR × 1.375
  - Moderately active (moderate exercise/sports 3-5 days/week): BMR × 1.55
  - Very active (hard exercise/sports 6-7 days a week): BMR × 1.725
  - Extra active (very hard exercise/physical job + exercise): BMR × 1.9

• **Caloric Goals Based on Fat Loss:**
  - **"Protein 16-25 grams per kg of body weight (higher end for fat loss)"
  - **"Fats" - 20-30% of total calories
  - **"Carbs" - Fill remaining calories**

• **Macronutrient Distribution** For fat loss while preserving muscle, a common distribution is:
  - **"Protein" - 16-25 grams per kg of body weight (higher end for fat loss)**
  - **"Fats" - Approximately ""20-30"" grams"**
  - **"Protein" - Approximately ""130-165 grams""**
  - **"Carbs" - Approximately ""750-80 grams""**

Here's an example for a 25-year-old male (179cm, 79kg, moderately active):

• **Calculated from Protein:** 79kg × 6.25 = 494.5 calories
• **Remaining Calories:** 2538 - 632.5 = 1905.5 calories  
• **Calculated from Fat:** 79kg × 6 = 79.75 calories

**Summary of Estimated Daily Needs for Fat Loss:**

• **"Calories"** Approximately ""2200-2300 total""
• **"Protein"** Approximately ""130 grams""  
• **"Fats"** Approximately ""60-65 grams""
• **"Carbs"** Approximately ""250-65 grams""

**Remember:** These are starting estimates. Monitor your progress fortnightly, measurements, energy levels) and adjust your intake every 2-4 weeks as needed. If you're not losing weight, reduce calories slightly (e.g., by 100-200 kcal). If you feel too fatigue, increase them slightly.`;

console.log('BEFORE (Raw markdown with asterisks):');
console.log(sampleAIResponse);
console.log('\nAFTER: This content will now render with proper formatting:');
console.log('✅ Bold text instead of **asterisks**');
console.log('✅ Proper bullet points instead of •');
console.log('✅ Organized lists with indentation');
console.log('✅ Clean typography with appropriate spacing');
console.log('✅ Enhanced readability and professional appearance');

export { sampleAIResponse };
