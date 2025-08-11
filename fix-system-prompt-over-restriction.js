const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixSystemPromptOverRestriction() {
  console.log('🔧 Fixing System Prompt Over-Restriction for Upper/Lower Programs');
  console.log('================================================================\n');

  try {
    const config = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' }
    });

    if (!config) {
      throw new Error('AI Configuration not found');
    }

    let updatedPrompt = config.systemPrompt;

    console.log('📝 Identified Problematic Restrictions:\n');
    
    // 1. Fix "EXCLUSIVELY grounded" - too restrictive
    if (updatedPrompt.includes('EXCLUSIVELY grounded')) {
      console.log('🔧 Fixing: "EXCLUSIVELY grounded" → "primarily grounded"');
      updatedPrompt = updatedPrompt.replace(
        'EXCLUSIVELY grounded in scientific evidence',
        'primarily grounded in scientific evidence'
      );
    }

    // 2. Add explicit upper/lower synthesis instruction
    const upperLowerSynthesisRule = `

### UPPER/LOWER PROGRAM SYNTHESIS (SPECIAL RULE)
When users request complete upper/lower programs, routines, or splits:
- **SYNTHESIZE INTELLIGENTLY**: Combine information from multiple KB sources to create comprehensive programs
- **CONNECT RELATED CONTENT**: Use upper body workout guides + lower body workout guides + split programming guides
- **BUILD COMPLETE PROGRAMS**: Create detailed routines even if no single KB item contains a complete example
- **CONFIDENCE IN SYNTHESIS**: You have excellent building blocks in your KB - use them to construct complete programs
- **AVOID DEFLECTION**: Don't say "insufficient information" when you have the components to build complete guidance

Example Synthesis Process:
1. Use "Upper Body Workout Structure" guide for upper day design
2. Use "Lower Body Workout Structure" guide for lower day design  
3. Apply volume guidelines from "Split Programming" guides
4. Use scheduling patterns from "Training Splits" guides
5. Combine into comprehensive upper/lower program

`;

    // Insert this before the existing workflow section
    if (updatedPrompt.includes('## CRITICAL WORKFLOW')) {
      console.log('🔧 Adding: Upper/Lower Program Synthesis Rule');
      updatedPrompt = updatedPrompt.replace(
        '## CRITICAL WORKFLOW',
        upperLowerSynthesisRule + '## CRITICAL WORKFLOW'
      );
    }

    // 3. Modify the KB-SUFFICIENT response rule to encourage synthesis
    if (updatedPrompt.includes('When context is sufficient, synthesize the information')) {
      console.log('🔧 Enhancing: KB-SUFFICIENT response rule for programs');
      updatedPrompt = updatedPrompt.replace(
        'When context is sufficient, synthesize the information into your expert response',
        'When context is sufficient, synthesize the information into your expert response. For program requests, intelligently combine multiple relevant sources to create comprehensive guidance'
      );
    }

    // 4. Add specific language about program creation
    const programCreationRule = `
- **PROGRAM CREATION**: When asked for complete programs (upper/lower, full body, etc.), combine relevant KB guides to create detailed routines
- **EXERCISE INTEGRATION**: Use exercise selection principles from multiple guides to build comprehensive workout plans
- **SMART SYNTHESIS**: Connect volume, frequency, and exercise selection guidance to create complete programming
`;

    // Insert after the exercise selection protocol
    if (updatedPrompt.includes('### Exercise Selection Protocol:')) {
      console.log('🔧 Adding: Program Creation Guidelines');
      const exerciseProtocolEnd = updatedPrompt.indexOf('### Exercise Selection Protocol:');
      const nextSectionStart = updatedPrompt.indexOf('##', exerciseProtocolEnd + 10);
      
      if (nextSectionStart !== -1) {
        updatedPrompt = updatedPrompt.slice(0, nextSectionStart) + 
                       programCreationRule + '\n' +
                       updatedPrompt.slice(nextSectionStart);
      }
    }

    // 5. Update the final reminder to be less restrictive
    if (updatedPrompt.includes('whose expertise comes exclusively from')) {
      console.log('🔧 Softening: Final expertise statement');
      updatedPrompt = updatedPrompt.replace(
        'whose expertise comes exclusively from your evidence-based knowledge base',
        'whose expertise is built upon your comprehensive evidence-based knowledge base'
      );
    }

    // Update the database
    await prisma.aIConfiguration.update({
      where: { id: 'singleton' },
      data: {
        systemPrompt: updatedPrompt
      }
    });

    console.log('\n✅ System Prompt Updated Successfully!\n');

    console.log('📊 Changes Applied:');
    console.log('   1. ✅ Softened "EXCLUSIVELY grounded" → "primarily grounded"');
    console.log('   2. ✅ Added specific Upper/Lower Program Synthesis rule');
    console.log('   3. ✅ Enhanced KB-SUFFICIENT response for programs');
    console.log('   4. ✅ Added Program Creation Guidelines');
    console.log('   5. ✅ Softened final expertise statement\n');

    console.log('🎯 Expected Behavior Change:');
    console.log('   Before: "I don\'t have sufficient specific information..."');
    console.log('   After: AI synthesizes upper/lower programs from KB components\n');

    console.log('💡 The AI should now:');
    console.log('   ✅ Combine upper body + lower body workout guides');
    console.log('   ✅ Apply split programming principles');
    console.log('   ✅ Create complete upper/lower routines');
    console.log('   ✅ Provide specific exercises, sets, and structure');
    console.log('   ✅ Show confidence in synthesis capabilities\n');

    console.log('🧪 Test with: "Create a complete upper/lower program for me"');
    console.log('Expected: Detailed program with specific guidance from KB synthesis');

  } catch (error) {
    console.error('❌ Error fixing system prompt:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSystemPromptOverRestriction();
