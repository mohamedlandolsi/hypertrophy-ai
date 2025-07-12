const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateAIConfiguration() {
  try {
    // Get current configuration
    const currentConfig = await prisma.aIConfiguration.findFirst({
      where: { id: 'singleton' }
    });

    if (!currentConfig) {
      console.log('No AI configuration found. Please run the admin setup first.');
      return;
    }

    // Update the system prompt to include new training structure examples
    const updatedPrompt = currentConfig.systemPrompt.replace(
      '- "I train 4 days a week" → call update_client_profile with weeklyTrainingDays: 4',
      `- "I train 4 days a week" → call update_client_profile with trainingStructureType: "weekly", weeklyTrainingDays: 4
- "I do 1 day on, 1 day off" → call update_client_profile with trainingStructureType: "cycle", trainingCycle: "1_on_1_off"
- "I train 2 days then rest 1 day" → call update_client_profile with trainingStructureType: "cycle", trainingCycle: "2_on_1_off"
- "I follow a custom 5 days on, 2 days off pattern" → call update_client_profile with trainingStructureType: "cycle", trainingCycle: "custom", customCyclePattern: "5 days on, 2 days off"`
    );

    // Update the configuration
    await prisma.aIConfiguration.update({
      where: { id: 'singleton' },
      data: {
        systemPrompt: updatedPrompt
      }
    });

    console.log('✅ AI Configuration updated successfully with new training structure examples!');
    console.log('The AI will now understand and extract cycle-based training patterns.');
    
  } catch (error) {
    console.error('Error updating AI configuration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAIConfiguration();
