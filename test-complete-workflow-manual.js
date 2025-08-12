const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const prisma = new PrismaClient();

async function testCompleteWorkflowWithManualContent() {
  try {
    console.log('🧪 Testing Complete AI Workflow with Retrieved Content...\n');
    
    // Get AI configuration
    const aiConfig = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });
    
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    // Simulate the exact content that would be retrieved and sent to AI
    const knowledgeContext = `
## Knowledge Base Context:
    
### From "A Guide to Structuring an Effective Lower Body Workout: An Exercise Recipe"
Building a complete and powerful lower body requires more than just one or two exercises. An effective workout should be built around one or both of these foundational movement patterns. Choose stable machines like Leg Press, Hack Squat, or Pendulum Squat for best results.

Every lower body workout should include:
- Hip Hinge Pattern (hip dominant movement): Romanian deadlifts, leg curls
- Squat Pattern (quad dominant movement): leg press, hack squat, pendulum squat
- For Quadriceps: Include isolation exercises like leg extensions
- For knee flexion function, you must include a Leg Curl. The Seated Leg Curl is the best machine variation.
- For Glutes: Hip thrust variations and Romanian deadlifts

### From "A Guide to Training Goals: The Difference Between Strength and Hypertrophy Training"
For Hypertrophy (muscle growth):
- Repetition Range: 5-10 reps is optimal for muscle growth
- Each set must be taken to failure or very close to it (0-2 RIR) to ensure maximum motor unit recruitment
- Use loads that allow perfect form through the required range of motion

### From "A Guide to Rest Periods: How Long to Rest Between Sets for Muscle Growth"
General Timeframe: Most effective rest periods will be between 2 and 5 minutes.
Factors That Determine Rest Time:
- Exercise Type: Compound movements need 3-5 minutes
- Load Used: Heavier loads require longer rest
- Personal recovery capacity
- Training goals

### From "A Guide to Optimal Repetition Ranges for Hypertrophy"
The optimal repetition range for muscle growth is 5-10 reps. By training in the 5-10 repetition range, you efficiently reach the stimulating reps while minimizing excessive fatigue and muscle damage.

### From "A Guide to Training Volume: Why Less Is More for Muscle Growth"
For effective hypertrophy training:
- Perform 3-4 working sets per exercise
- Keep total volume manageable to maintain quality
- Each set should be high effort (close to failure)
`;

    const userQuery = "Design a complete, evidence-based leg workout";
    
    const messages = [
      {
        role: 'user',
        parts: [{
          text: `${aiConfig.systemPrompt}\n\n${knowledgeContext}\n\nUser Question: ${userQuery}`
        }]
      }
    ];

    console.log('🤖 Sending to AI with complete knowledge context...');
    
    const result = await model.generateContent({
      contents: messages,
      generationConfig: {
        temperature: 0.4,
        topK: 30,
        topP: 0.9,
        maxOutputTokens: 2048,
      },
    });
    
    const response = result.response;
    const text = response.text();
    
    console.log('\n📋 AI Response:');
    console.log('=' * 50);
    console.log(text);
    console.log('=' * 50);
    
    // Analysis
    console.log('\n📊 Response Analysis:');
    const hasSpecificReps = /\b\d+-\d+\s*rep/i.test(text) || /\b\d+\s*rep/i.test(text);
    const hasSpecificSets = /\b\d+\s*set/i.test(text);
    const hasRestPeriods = /\d+\s*minute/i.test(text) || /rest.*\d+/i.test(text);
    const hasSpecificExercises = /leg press|hack squat|leg curl|romanian deadlift/i.test(text);
    const hasCitations = /\(KB:/i.test(text);
    
    console.log(`✅ Specific rep ranges: ${hasSpecificReps ? '✓' : '✗'}`);
    console.log(`✅ Specific set numbers: ${hasSpecificSets ? '✓' : '✗'}`);
    console.log(`✅ Rest period guidance: ${hasRestPeriods ? '✓' : '✗'}`);
    console.log(`✅ Specific exercise selection: ${hasSpecificExercises ? '✓' : '✗'}`);
    console.log(`✅ Knowledge base citations: ${hasCitations ? '✓' : '✗'}`);
    
    if (hasSpecificReps && hasSpecificSets && hasRestPeriods && hasSpecificExercises && hasCitations) {
      console.log('\n🎉 EXCELLENT: Complete, actionable leg workout with all programming parameters!');
    } else {
      console.log('\n⚠️  INCOMPLETE: Missing some programming details despite having KB content');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testCompleteWorkflowWithManualContent();
