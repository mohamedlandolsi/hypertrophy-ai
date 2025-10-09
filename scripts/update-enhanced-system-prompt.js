const { PrismaClient } = require('@prisma/client');

async function updateSystemPromptWithEnhancements() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Updating system prompt with enhanced profile management...\n');
    
    // Get current configuration
    const config = await prisma.aIConfiguration.findFirst();
    
    if (!config) {
      console.log('❌ No AI configuration found');
      return;
    }
    
    console.log('📝 Current system prompt length:', config.systemPrompt.length);
    
    // Enhanced additions to the system prompt
    const enhancedInstructions = `

**ENHANCED MEMORY UPDATE PROTOCOL:**

9. **MANDATORY FUNCTION CALLING FOR PROFILE UPDATES:**
When you identify conflicts or new information as described in instructions #6 and #8, you MUST use the provided function calling tools:
- **For conflicts:** Use \`detectProfileConflict\` function to log and handle conflicts
- **For updates:** Use \`updateClientProfile\` function to save new information
- **Always provide a clear updateReason** explaining why the profile is being updated

10. **CONFLICT DETECTION TRIGGERS:**
Always check for conflicts when users request:
- Training programs with different frequency than their profile (e.g., user has 3 days/week but requests 5-day PPL)
- Exercises they've previously mentioned disliking or having injuries with
- Goals that contradict their current objectives
- Training styles that don't match their experience level
- Equipment requirements that don't match their gym access

When conflicts are detected:
1. **MUST call detectProfileConflict function first** with conflict details
2. **Follow the exact 3-step process** in instruction #8
3. **After user confirmation, call updateClientProfile function** to save changes

11. **PROACTIVE INFORMATION EXTRACTION:**
During every conversation, actively scan for and extract:
- **Training preferences:** "I love/hate [exercise]", "I prefer [style]"
- **Physical limitations:** "My knee hurts when I...", "I can't do..."
- **Goal changes:** "I want to reach [weight]", "My new goal is..."
- **Schedule changes:** "I can only train [X] days now"
- **Equipment access:** "I just got a home gym", "My gym closed"
- **Personal records:** "I just hit [weight] on [exercise]"
- **Life events:** "I'm traveling next month", "I'm injured"

For each piece of new information, **MUST call updateClientProfile function** with appropriate fields and updateReason.

12. **FUNCTION CALLING REQUIREMENTS:**
- **updateClientProfile** must be called whenever you learn new lasting information about the client
- **detectProfileConflict** must be called when you detect any conflicts before addressing them
- **Always provide updateReason** explaining what triggered the update
- **Be specific** with field names and values
- **Log conflicts** with proper severity levels (minor/moderate/major)

**CRITICAL:** These function calls happen automatically in the background. You do not need to mention to the user that you are calling functions or updating their profile unless there's a conflict that requires their confirmation.`;

    // Add the enhanced instructions to the existing system prompt
    const updatedSystemPrompt = config.systemPrompt + enhancedInstructions;
    
    console.log('📝 Enhanced system prompt length:', updatedSystemPrompt.length);
    console.log('📈 Added instructions length:', enhancedInstructions.length);
    
    // Update the configuration
    await prisma.aIConfiguration.update({
      where: { id: config.id },
      data: {
        systemPrompt: updatedSystemPrompt,
        updatedAt: new Date()
      }
    });
    
    console.log('✅ System prompt updated successfully!');
    
    // Verify the update
    const updatedConfig = await prisma.aIConfiguration.findFirst();
    console.log('🔍 Verification - New prompt length:', updatedConfig?.systemPrompt.length);
    
    // Check for key enhancement markers
    const hasEnhancedProtocol = updatedConfig?.systemPrompt.includes('ENHANCED MEMORY UPDATE PROTOCOL');
    const hasFunctionCalling = updatedConfig?.systemPrompt.includes('MANDATORY FUNCTION CALLING');
    const hasConflictTriggers = updatedConfig?.systemPrompt.includes('CONFLICT DETECTION TRIGGERS');
    
    console.log('\n✅ Enhancement Verification:');
    console.log(`- Enhanced Memory Protocol: ${hasEnhancedProtocol ? '✅' : '❌'}`);
    console.log(`- Function Calling Instructions: ${hasFunctionCalling ? '✅' : '❌'}`);
    console.log(`- Conflict Detection Triggers: ${hasConflictTriggers ? '✅' : '❌'}`);
    
    console.log('\n🎯 System is now configured for:');
    console.log('- Automatic profile conflict detection');
    console.log('- Reliable memory updates via function calling');
    console.log('- Proactive information extraction');
    console.log('- Structured conflict resolution');
    
  } catch (error) {
    console.error('❌ Error updating system prompt:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateSystemPromptWithEnhancements();
